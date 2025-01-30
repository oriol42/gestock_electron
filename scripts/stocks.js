const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// -------------------------------------------------
// CONFIGURATION DE LA BASE DE DONNÉES
// -------------------------------------------------
const dbPath = path.join(__dirname, '../database/gestock.db');
const db = new sqlite3.Database(dbPath);

// Création des tables nécessaires
db.exec(`
    CREATE TABLE IF NOT EXISTS threshold_registry (
        stock_key TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        threshold INTEGER NOT NULL,
        stockCategory TEXT NOT NULL
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movement_date TEXT NOT NULL,
        movement_type TEXT NOT NULL,
        stock_key TEXT NOT NULL,
        stock_name TEXT NOT NULL
    )
`);

// -------------------------------------------------
// FONCTIONS UTILITAIRES
// -------------------------------------------------
const runQuery = (query, params = []) =>
    new Promise((resolve, reject) =>
        db.run(query, params, (err) => (err ? reject(err) : resolve()))
    );

const selectQuery = (query, params = []) =>
    new Promise((resolve, reject) =>
        db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)))
    );

// -------------------------------------------------
// AFFICHAGE DES STOCKS
// -------------------------------------------------
async function displayStocks() {
    const container = document.getElementById('view-stock-content');
    container.innerHTML = '<h2>Stocks disponibles</h2>';

    try {
        const stocks = await selectQuery(`
            SELECT stock_key, display_name, threshold, stockCategory
            FROM threshold_registry 
            ORDER BY display_name ASC
        `);

        if (stocks.length === 0) {
            container.innerHTML += '<p>Aucun stock à afficher.</p>';
            return;
        }

        // Ajouter la barre de recherche si des stocks existent
        const searchBar = document.createElement('input');
        searchBar.id = 'search-bar';
        searchBar.type = 'text';
        searchBar.placeholder = 'Rechercher un stock...';
        container.appendChild(searchBar);

        const stockList = document.createElement('ul');
        stockList.id = 'stock-list';

        stocks.forEach((stock) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${stock.display_name}</strong><br>
                <span>Seuil: ${stock.threshold}</span><br>
                <span>Catégorie: ${stock.stockCategory}</span>
            `;

            li.dataset.stockKey = stock.stock_key;
            li.dataset.stockName = stock.display_name;

            li.addEventListener('click', () => {
                loadTable(stock.stock_key, stock.display_name);
            });

            stockList.appendChild(li);
        });

        container.appendChild(stockList);

        // Gestionnaire de recherche
        searchBar.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const stockItems = document.querySelectorAll('#stock-list li');

            stockItems.forEach((item) => {
                const stockName = item.dataset.stockName.toLowerCase();
                if (stockName.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    } catch (err) {
        alert('Erreur de chargement des stocks : ' + err.message);
        console.error(err);
    }
}

// -------------------------------------------------
// CHARGEMENT DU TABLEAU DES PRODUITS
// -------------------------------------------------
async function loadTable(stockKey, stockName) {
    // Charger le fichier table.html dans le right-pane
    const rightPane = document.querySelector('.right-pane');
    const response = await fetch('table.html');
    const htmlContent = await response.text();
    rightPane.innerHTML = htmlContent;

    // Mettre à jour le titre du tableau
    document.getElementById('stock-details-title').textContent = `Détails du stock : ${stockName}`;

    // Récupérer les données de la table correspondante dans la base de données
    try {
        const stockData = await selectQuery(`SELECT * FROM "${stockKey}" ORDER BY addDate DESC`);

        const tableBody = document.getElementById('stock-details-table').querySelector('tbody');
        tableBody.innerHTML = ''; // Réinitialiser le contenu du tableau

        if (stockData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Aucun produit trouvé dans ce stock.</td>
                </tr>
            `;
            return;
        }

        // Remplir le tableau avec les données
        stockData.forEach((row) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.id}</td>
                <td>${row.name}</td>
                <td>${row.quantity}</td>
                <td>${row.price.toFixed(2)}</td>
                <td>${row.purchasingPrice.toFixed(2)}</td>
                <td>${row.addDate}</td>
                <td>${row.category}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Erreur lors du chargement des détails du stock :', err);
        alert('Une erreur est survenue lors du chargement des détails du stock.');
    }

    // Réattacher les écouteurs d'événements après le chargement du contenu
    attachEventListeners();
}

// -------------------------------------------------
// BOUTON DE SUPPRESSION DE STOCK
// -------------------------------------------------
async function deleteStock() {
    // Vider la right-pane avant d'afficher les stocks
    const rightPane = document.querySelector('.right-pane');
    rightPane.innerHTML = '<h2 style="color:red;font-weight:bold;">Supprimer un stock</h2>';

    try {
        // Récupérer la liste des stocks
        const stocks = await selectQuery(`
            SELECT stock_key, display_name
            FROM threshold_registry
            ORDER BY display_name ASC
        `);

        if (stocks.length === 0) {
            rightPane.innerHTML += '<p>Aucun stock disponible à supprimer.</p>';
            return;
        }

        // Créer la barre de recherche
        const searchBar = document.createElement('input');
        searchBar.id = 'search-bar';
        searchBar.type = 'text';
        searchBar.placeholder = 'Rechercher un stock...';
        rightPane.appendChild(searchBar);

        // Créer un conteneur pour les boutons de stock
        const stockButtonsContainer = document.createElement('div');
        stockButtonsContainer.id = 'stock-buttons-container';

        // Ajouter un bouton pour chaque stock
        stocks.forEach((stock) => {
            const button = document.createElement('button');
            button.className = 'stock-button';
            button.textContent = stock.display_name;

            // Ajouter un écouteur d'événements pour chaque bouton
            button.addEventListener('click', async () => {
                const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer le stock "${stock.display_name}" ?`);

                if (confirmDelete) {
                    try {
                        // Supprimer la table correspondante dans la base de données
                        await runQuery(`DROP TABLE IF EXISTS "${stock.stock_key}"`);

                        // Supprimer l'entrée dans la table threshold_registry
                        await runQuery(`
                            DELETE FROM threshold_registry
                            WHERE stock_key = ?
                        `, [stock.stock_key]);

                        alert(`Le stock "${stock.display_name}" a été supprimé avec succès.`);

                        // Recharger la liste des stocks
                        deleteStock(); // Rafraîchir l'affichage après suppression

                        // Enregistrer le mouvement de la suppression de stock
                        await recordStockMovement("suppression", stock.stock_key, stock.display_name);
                    } catch (err) {
                        console.error('Erreur lors de la suppression du stock :', err);
                        alert('Une erreur est survenue lors de la suppression du stock.');
                    }
                }
            });

            stockButtonsContainer.appendChild(button);
        });

        rightPane.appendChild(stockButtonsContainer);

        // Gestionnaire de recherche
        searchBar.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const stockButtons = document.querySelectorAll('#stock-buttons-container .stock-button');

            stockButtons.forEach((button) => {
                const stockName = button.textContent.toLowerCase();
                if (stockName.includes(searchTerm)) {
                    button.style.display = '';
                } else {
                    button.style.display = 'none';
                }
            });
        });

    } catch (err) {
        console.error('Erreur lors du chargement des stocks :', err);
        alert('Une erreur est survenue lors du chargement des stocks.');
    }
}
// -------------------------------------------------
// AFFICHER UNE FENÊTRE MODALE POUR MODIFIER UN STOCK
// -------------------------------------------------
function showEditToplevel(stockKey, stockName) {
    // Créer un conteneur pour le Toplevel (utilisé comme modale)
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
        <h2>Modifier le stock : ${stockName}</h2>
        <form id="edit-stock-form">
            <div class="input-group">
                <label for="edit-stock-name">Nom du stock :</label>
                <input type="text" id="edit-stock-name" name="edit-stock-name" value="${stockName}" required>
            </div>
            <div class="input-group">
                <label for="edit-stock-threshold">Seuil de réapprovisionnement :</label>
                <input type="number" id="edit-stock-threshold" name="edit-stock-threshold" required>
            </div>
            <div class="input-group">
                <label for="edit-stock-description">Description :</label>
                <textarea id="edit-stock-description" name="edit-stock-description" rows="5"></textarea>
            </div>
            <div class="input-group">
                <label for="edit-stock-category">Catégorie :</label>
                <select id="edit-stock-category" name="edit-stock-category">
                    <option value="Stock de réapprovisionnement">Ravitailleur</option>
                    <option value="Stock standard">Stock standard</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button type="submit" class="btn-save">Enregistrer</button>
                <button type="button" class="btn-cancel">Annuler</button>
            </div>
        </form>
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    // Gestion de la soumission du formulaire
    const editStockForm = document.getElementById('edit-stock-form');
    editStockForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newStockName = document.getElementById('edit-stock-name').value.trim();
        const newThreshold = document.getElementById('edit-stock-threshold').value;
        const newDescription = document.getElementById('edit-stock-description').value.trim();
        const newCategory = document.getElementById('edit-stock-category').value;

        if (!newStockName || !newThreshold || !newDescription || !newCategory) {
            alert('Veuillez remplir tous les champs.');
            return;
        }

        try {
            // Mettre à jour les informations du stock dans la base de données
            await runQuery(`
                UPDATE threshold_registry
                SET display_name = ?, threshold = ?, stockCategory = ?
                WHERE stock_key = ?
            `, [newStockName, newThreshold, newCategory, stockKey]);

            alert(`Le stock "${newStockName}" a été mis à jour avec succès.`);

            // Supprimer la fenêtre modale après mise à jour
            document.body.removeChild(modalOverlay);
            modifyStock(); // Recharger la liste des stocks

            // Enregistrer le mouvement de modification de stocks
            await recordStockMovement("Modification", stockKey, newStockName);
        } catch (err) {
            console.error('Erreur lors de la modification du stock :', err);
            alert('Une erreur est survenue lors de la modification du stock.');
        }
    });

    // Gestion du bouton "Annuler"
    const cancelButton = modal.querySelector('.btn-cancel');
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
}

// -------------------------------------------------
// BOUTON DE MODIFICATION DE STOCK
// -------------------------------------------------
async function modifyStock() {
    const rightPane = document.querySelector('.right-pane');
    rightPane.innerHTML = '<h2>Modifier un stock</h2>';

    try {
        const stocks = await selectQuery(`
            SELECT stock_key, display_name
            FROM threshold_registry
            ORDER BY display_name ASC
        `);

        if (stocks.length === 0) {
            rightPane.innerHTML += '<p>Aucun stock disponible à modifier.</p>';
            return;
        }

        // Créer la barre de recherche
        const searchBar = document.createElement('input');
        searchBar.id = 'search-bar';
        searchBar.type = 'text';
        searchBar.placeholder = 'Rechercher un stock...';
        rightPane.appendChild(searchBar);

        const stockButtonsContainer = document.createElement('div');
        stockButtonsContainer.id = 'stock-buttons-container';

        stocks.forEach((stock) => {
            const button = document.createElement('button');
            button.className = 'stock-button';
            button.textContent = stock.display_name;

            button.addEventListener('click', () => {
                showEditToplevel(stock.stock_key, stock.display_name);
            });

            stockButtonsContainer.appendChild(button);
        });

        rightPane.appendChild(stockButtonsContainer);

        // Gestionnaire de recherche
        searchBar.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const stockButtons = document.querySelectorAll('#stock-buttons-container .stock-button');

            stockButtons.forEach((button) => {
                const stockName = button.textContent.toLowerCase();
                if (stockName.includes(searchTerm)) {
                    button.style.display = '';
                } else {
                    button.style.display = 'none';
                }
            });
        });

    } catch (err) {
        console.error('Erreur lors du chargement des stocks :', err);
        alert('Une erreur est survenue lors du chargement des stocks.');
    }
}

// -------------------------------------------------
// AFFICHER LE FORMULAIRE D'AJOUT DE STOCK
// -------------------------------------------------
function showAddStockForm() {
    const rightPane = document.querySelector('.right-pane');
    rightPane.innerHTML = `
        <form id="add-stock-form">
            <h2>Ajouter un stock</h2>
            <div class="input-group">
                <label for="stock-name">Nom du stock :</label>
                <input type="text" id="stock-name" name="stock-name" required>
            </div>
            <div class="input-group">
                <label for="stock-threshold">Seuil de réapprovisionnement :</label>
                <input type="number" id="stock-threshold" name="stock-threshold" required>
            </div>
            <div class="input-group">
                <label for="stock-description">Description du stock :</label>
                <textarea id="stock-description" name="stock-description" rows="10" required></textarea>
            </div>
            <div class="input-group">
                <label for="stock-category">Catégorie du stock :</label>
                <select id="stock-category" name="stock-category">
                    <option value="Stock de réapprovisionnement">Ravitailleur</option>
                    <option value="Stock standard">Stock standard</option>
                </select>
            </div>
            <button type="submit" class="btn-login">Ajouter</button>
        </form>
    `;

    // Réattacher les écouteurs d'événements
    attachEventListeners();

    // Gestion du formulaire d'ajout de stock
    const addStockForm = document.getElementById('add-stock-form');
    if (addStockForm) {
        addStockForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const stockName = document.getElementById('stock-name').value.trim();
            const stockThreshold = document.getElementById('stock-threshold').value;
            const stockDescription = document.getElementById('stock-description').value.trim();
            const stockCategory = document.getElementById('stock-category').value;

            if (!stockName || !stockThreshold || !stockDescription || !stockCategory) {
                alert('Veuillez remplir tous les champs du formulaire.');
                return;
            }

            try {
                // Nettoyer le nom du stock pour créer une clé valide
                const cleanTableName = stockName
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^\w]/g, '_')
                    .toLowerCase();

                // Créer une nouvelle table pour le stock
                await runQuery(`
                    CREATE TABLE IF NOT EXISTS "${cleanTableName}" (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        quantity INTEGER NOT NULL DEFAULT 0,
                        price REAL NOT NULL,
                        purchasingPrice REAL NOT NULL,
                        addDate TEXT NOT NULL,
                        category TEXT NOT NULL
                    )
                `);

                // Ajouter le stock à la table threshold_registry
                await runQuery(`
                    INSERT INTO threshold_registry (stock_key, display_name, threshold, stockCategory)
                    VALUES (?, ?, ?, ?)
                `, [cleanTableName, stockName, stockThreshold, stockCategory]);

                // Enregistrer l'ajout dans l'historique
                await recordStockMovement('ajout', cleanTableName, stockName);

                // Réinitialiser le formulaire
                addStockForm.reset();
                // Afficher un message de succès
                alert('Stock ajouté avec succès !');
                // Recharger la liste des stocks
                displayStocks();
            } catch (err) {
                console.error('Erreur lors de l\'ajout du stock :', err);
                alert('Une erreur est survenue lors de l\'ajout du stock.');
            }
        });
    }
}

// -------------------------------------------------
// FONCTIONS POUR SAUVERGARDER LES MOUVEMENTS
// -------------------------------------------------
async function recordStockMovement(movementType, stockKey, stockName) {
    const movementDate = new Date().toISOString(); // Date du mouvement
    try {
        await runQuery(`
            INSERT INTO stock_movement (movement_date, movement_type, stock_key, stock_name)
            VALUES (?, ?, ?, ?)
        `, [movementDate, movementType, stockKey, stockName]);
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement du mouvement de stock :', err);
    }
}

// -------------------------------------------------
// AFFICHER L'HISTORIQUE DES MOUVEMENTS DE STOCK
// -------------------------------------------------

async function displayStockMovements() {
    const rightPane = document.querySelector('.right-pane');
    rightPane.innerHTML = '<h2>Historique des mouvements de stock</h2>';

    try {
        const movements = await selectQuery(`
            SELECT * FROM stock_movement
            ORDER BY movement_date DESC
        `);

        // Créer la barre de recherche
        const searchBar = document.createElement('input');
        searchBar.id = 'search-bar';
        searchBar.type = 'text';
        searchBar.placeholder = 'Rechercher un mouvement...';
        rightPane.appendChild(searchBar);

        const movementsList = document.createElement('ul');
        movements.forEach((movement) => {
            const li = document.createElement('li');
            li.className = 'movement-item';
            const formattedDate = new Date(movement.movement_date).toLocaleString();
            li.innerHTML = `
                <strong>${movement.movement_type}</strong><br>
                <span>Stock: ${movement.stock_name}</span><br>
                <span>Date: ${formattedDate}</span>
            `;
            movementsList.appendChild(li);
        });

        rightPane.appendChild(movementsList);

        // Gestionnaire de recherche
        searchBar.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const movementItems = document.querySelectorAll('.movement-item');

            movementItems.forEach((item) => {
                const movementText = item.innerText.toLowerCase();
                if (movementText.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });

    } catch (err) {
        console.error('Erreur lors du chargement des mouvements de stock :', err);
        alert('Une erreur est survenue lors du chargement des mouvements de stock.');
    }
}

// -------------------------------------------------
// GESTION DES ÉVÉNEMENTS
// -------------------------------------------------
function attachEventListeners() {
    // Gestion du bouton "Consulter un stock"
    const consultStockButton = document.querySelector('.menu-button:nth-child(1)');
    if (consultStockButton) {
        consultStockButton.addEventListener('click', () => {
            const rightPane = document.querySelector('.right-pane');
            rightPane.innerHTML = '';
            const stockContent = document.createElement('div');
            stockContent.id = 'view-stock-content';
            rightPane.appendChild(stockContent);
            displayStocks();
        });
    }

    // Gestion du bouton "Ajouter un stock"
    const addStockButton = document.querySelector('.menu-button:nth-child(2)');
    if (addStockButton) {
        addStockButton.addEventListener('click', () => {
            const rightPane = document.querySelector('.right-pane');
            rightPane.innerHTML = '';
            showAddStockForm();
        });
    }

    // Gestion du bouton "Modifier un stock"
    const modifyStockButton = document.querySelector('.menu-button:nth-child(3)');
    if (modifyStockButton) {
        modifyStockButton.addEventListener('click', modifyStock);
    }

    // Gestion du bouton "Supprimer un stock"
    const deleteStockButton = document.querySelector('.menu-button:nth-child(4)');
    if (deleteStockButton) {
        deleteStockButton.addEventListener('click', deleteStock);
    }

    // Gestion du bouton "Voir les mouvements de stock" (6ème bouton)
    const viewMovementButton = document.querySelector('.menu-button:nth-child(6)');
    if (viewMovementButton) {
        viewMovementButton.addEventListener('click', () => {
            const rightPane = document.querySelector('.right-pane');
            rightPane.innerHTML = '';
            const movementContent = document.createElement('div');
            movementContent.id = 'view-stock-movement-content';
            rightPane.appendChild(movementContent);
            displayStockMovements(); // Afficher les mouvements de stock
        });
    }
}

// -------------------------------------------------
// INITIALISATION
// -------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Afficher les stocks disponibles au chargement de la page
    displayStocks();

    // Attacher les écouteurs d'événements
    attachEventListeners();
});

// -------------------------------------------------
// MESSAGE DE CONFIRMATION
// -------------------------------------------------
console.log("Script chargé : Tous les gestionnaires d'événements ont été enregistrés avec succès.");