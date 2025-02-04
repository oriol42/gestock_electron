// Données de test
let products = [
    {
      id: 1,
      name: "Smartphone",
      reference: "REF001",
      price: 599.99,
      quantity: 10,
      category: "Electronique",
      supplier: "Fournisseur A",
    },
    {
      id: 2,
      name: "T-shirt",
      reference: "REF002",
      price: 19.99,
      quantity: 5,
      category: "Vêtements",
      supplier: "Fournisseur B",
    },
    {
      id: 3,
      name: "Pommes",
      reference: "REF003",
      price: 2.99,
      quantity: 0,
      category: "Alimentation",
      supplier: "Fournisseur C",
    },
  ];
  
  // Éléments du DOM
  const productTableBody = document.querySelector("#productTable tbody");
  const addProductBtn = document.getElementById("addProductBtn");
  const productFormModal = document.getElementById("productFormModal");
  const productForm = document.getElementById("productForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const stockFilter = document.getElementById("stockFilter");
  const totalProducts = document.getElementById("totalProducts");
  const outOfStockProducts = document.getElementById("outOfStockProducts");
  const lowStockProducts = document.getElementById("lowStockProducts");
  const notification = document.getElementById("notification");
  const notificationMessage = document.getElementById("notificationMessage");
  
  // Variables pour la pagination
  let currentPage = 1;
  const productsPerPage = 5;
  
  // Afficher les produits
  function renderProducts() {
    productTableBody.innerHTML = "";
    const filteredProducts = filterProducts();
    const paginatedProducts = paginateProducts(filteredProducts);
  
    paginatedProducts.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><a href="#" class="product-name">${product.name}</a></td>
        <td>${product.reference}</td>
        <td>${product.price.toFixed(2)} Fcfa</td>
        <td>
          <span class="stock-indicator ${getStockIndicatorClass(product.quantity)}"></span>
          ${product.quantity}
        </td>
        <td>${product.category}</td>
        <td>${product.supplier}</td>
        <td>
          <button class="edit-btn" data-id="${product.id}">✏️</button>
          <button class="delete-btn" data-id="${product.id}">🗑️</button>
        </td>
      `;
      productTableBody.appendChild(row);
    });
  
    updatePagination(filteredProducts.length);
    updateStats();
    checkStockAlerts();
  }
  
  // Filtrer les produits
  function filterProducts() {
    let filtered = products;
  
    // Filtre par recherche
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.reference.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );
    }
  
    // Filtre par catégorie
    const selectedCategory = categoryFilter.value;
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }
  
    // Filtre par statut de stock
    const selectedStock = stockFilter.value;
    if (selectedStock === "in_stock") {
      filtered = filtered.filter((product) => product.quantity > 10);
    } else if (selectedStock === "low_stock") {
      filtered = filtered.filter((product) => product.quantity > 0 && product.quantity <= 10);
    } else if (selectedStock === "out_of_stock") {
      filtered = filtered.filter((product) => product.quantity === 0);
    }
  
    return filtered;
  }
  
  // Pagination
  function paginateProducts(filteredProducts) {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }
  
  function updatePagination(totalProducts) {
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    document.getElementById("pageInfo").textContent = `Page ${currentPage} sur ${totalPages}`;
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;
  }
  
  // Gestion des événements
  addProductBtn.addEventListener("click", () => {
    productForm.reset();
    document.getElementById("modalTitle").textContent = "Ajouter un produit";
    productFormModal.style.display = "flex";
  });
  
  cancelBtn.addEventListener("click", () => {
    productFormModal.style.display = "none";
  });
  
  productForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const productId = document.getElementById("productReference").value;
    const existingProduct = products.find((product) => product.reference === productId);
  
    if (existingProduct) {
      // Modifier le produit existant
      Object.assign(existingProduct, getFormData());
    } else {
      // Ajouter un nouveau produit
      products.push({ id: products.length + 1, ...getFormData() });
    }
  
    productFormModal.style.display = "none";
    renderProducts();
  });
  
  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderProducts();
    }
  });
  
  document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(filterProducts().length / productsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderProducts();
    }
  });
  
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderProducts();
  });
  
  categoryFilter.addEventListener("change", () => {
    currentPage = 1;
    renderProducts();
  });
  
  stockFilter.addEventListener("change", () => {
    currentPage = 1;
    renderProducts();
  });
  
  // Aide pour le formulaire
  function getFormData() {
    return {
      name: document.getElementById("productName").value,
      reference: document.getElementById("productReference").value,
      price: parseFloat(document.getElementById("productPrice").value),
      quantity: parseInt(document.getElementById("productQuantity").value),
      category: document.getElementById("productCategory").value,
      supplier: "Fournisseur A", // À adapter selon vos besoins
    };
  }
  
  // Indicateur de stock
  function getStockIndicatorClass(quantity) {
    if (quantity === 0) return "red";
    if (quantity <= 10) return "orange";
    return "green";
  }
  
  // Statistiques
  function updateStats() {
    totalProducts.textContent = products.length;
    outOfStockProducts.textContent = products.filter((product) => product.quantity === 0).length;
    lowStockProducts.textContent = products.filter((product) => product.quantity > 0 && product.quantity <= 10).length;
  }
  
  // Notifications
  function checkStockAlerts() {
    const outOfStockCount = products.filter((product) => product.quantity === 0).length;
    const lowStockCount = products.filter((product) => product.quantity > 0 && product.quantity <= 10).length;
  
    if (outOfStockCount > 0 || lowStockCount > 0) {
      notificationMessage.textContent = `Attention : ${outOfStockCount} produits en rupture, ${lowStockCount} produits en stock faible.`;
      notification.style.display = "block";
    } else {
      notification.style.display = "none";
    }
  }
  
  // Initialisation
  renderProducts();