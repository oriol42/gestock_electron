// Graphique des ventes hebdomadaires
new Chart(document.getElementById("weeklySalesChart"), {
    type: "line",
    data: {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [{
            label: "Ventes cette semaine",
            data: [5000, 4500, 6000, 7000, 5500, 8000, 9000],
            borderColor: "#4A90E2",
            fill: false,
        }, {
            label: "Ventes la semaine dernière",
            data: [4000, 5000, 5500, 6000, 7000, 7500, 8000],
            borderColor: "#FF6B6B",
            fill: false,
        }],
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: "bottom" },
        },
    },
});

// Graphique des stocks par catégorie
new Chart(document.getElementById("stockByCategoryChart"), {
    type: "bar",
    data: {
        labels: ["Électronique", "Vêtements", "Accessoires"],
        datasets: [{
            label: "Stocks",
            data: [300, 200, 100],
            backgroundColor: ["#4A90E2", "#FF6B6B", "#32CD32"],
        }],
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: "bottom" },
        },
    },
});

// Gestion du modal d'alerte
function openAlertModal() {
    document.getElementById("alertModal").style.display = "flex";
}

function closeAlertModal() {
    document.getElementById("alertModal").style.display = "none";
}

// Ouvrir le modal d'alerte automatiquement au chargement de la page
/*window.onload = openAlertModal;*/