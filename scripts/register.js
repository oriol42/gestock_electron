const { ipcRenderer } = require('electron'); // Pour communiquer avec le processus principal (si nécessaire)
const sqlite3 = require('sqlite3').verbose(); // Pour interagir avec SQLite3
const path = require('path'); // Pour gérer les chemins de fichiers
const bcrypt = require('bcrypt'); // Pour hacher les mots de passe
const saltRounds = 10; // Nombre de tours de hachage

// Chemin relatif vers la base de données
const dbPath = path.join(__dirname, '../database/gestock.db');

// Ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données', err);
    } else {
        console.log('Connecté à la base de données SQLite3');
    }
});

// Récupérer les éléments du DOM
const registrationForm = document.getElementById('registration-form');
const backbutton = document.getElementById('backbutton');

// Vérifier que le formulaire existe
if (!registrationForm) {
    console.error('Le formulaire avec l\'ID "registration-form" n\'a pas été trouvé.');
} else {
    console.log('Formulaire trouvé :', registrationForm);
}

// Gérer la soumission du formulaire
registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Empêcher la soumission par défaut du formulaire
    console.log('Formulaire soumis');

    // Récupérer les données du formulaire
    const username = document.getElementById('username').value;
    const companyname = document.getElementById('companyname').value;
    const password = document.getElementById('password').value;
    const description = document.getElementById('description').value;
    const localisation = document.getElementById('localisation').value;

    console.log('Données du formulaire :', { username, companyname, password, description, localisation });

    // Valider les données
    if (!username || !companyname || !password || !description || !localisation) {
        console.log('Validation échouée : Tous les champs doivent être remplis');
        alert('Veuillez remplir tous les champs.');
        return;
    }

    try {
        // Hacher le mot de passe
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Mot de passe haché :', hash);

        // Vérifier que le nom d'utilisateur est unique
        const row = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM accounts WHERE username = ?", [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (row) {
            console.log('Nom d\'utilisateur déjà utilisé :', username);
            alert('Ce nom d\'utilisateur est déjà utilisé.');
            return;
        }

        // Insérer les données dans la base de données
        await new Promise((resolve, reject) => {
            const query = `
                INSERT INTO accounts (username, companyname, password, description, localisation)
                VALUES (?, ?, ?, ?, ?)
            `;
            db.run(query, [username, companyname, hash, description, localisation], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Compte créé avec succès');
        alert('Votre compte a été créé avec succès !'); // Message de validation
        // Réinitialiser le formulaire
        registrationForm.reset();
        // Rediriger vers la page de connexion
        window.open("index.html", "_self");
    } catch (error) {
        console.error('Erreur lors de la création du compte :', error);
        alert('Erreur : Impossible de créer le compte. Veuillez réessayer.');
    }
});

// Gérer le clic sur le bouton "Retour"
backbutton.addEventListener("click", () => {
    window.open("index.html", "_self"); // Rediriger vers la page de connexion
});