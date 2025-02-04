document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        // Désactiver les sections et les items actifs
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.report-section').forEach(section => section.classList.remove('active'));

        // Activer la section sélectionnée
        this.classList.add('active');
        const sectionId = this.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
    });
});
