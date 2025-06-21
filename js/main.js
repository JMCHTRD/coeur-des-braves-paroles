document.addEventListener('DOMContentLoaded', function () {
    // Le nom du dépôt est utilisé pour construire les chemins absolus.
    const repoName = 'coeur-des-braves-paroles';
    const basePath = `/${repoName}`;

    const initializeDynamicContent = () => {
        const headerPath = `${basePath}/includes/_header.html`;
        const footerPath = `${basePath}/includes/_footer.html`;
        
        const headerPlaceholder = document.getElementById('header-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (headerPlaceholder) {
            fetch(headerPath)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to fetch header: ${response.statusText}`);
                    return response.text();
                })
                .then(data => {
                    headerPlaceholder.innerHTML = data;
                    // Une fois le header chargé, on configure la navigation et le lien actif.
                    setupNavigation();
                    setActiveLink(basePath);
                })
                .catch(error => console.error('Error loading header:', error));
        }

        if (footerPlaceholder) {
            fetch(footerPath)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to fetch footer: ${response.statusText}`);
                    return response.text();
                })
                .then(data => {
                    footerPlaceholder.innerHTML = data;
                    // Met à jour l'année dans le footer.
                    const yearSpan = footerPlaceholder.querySelector('#year');
                    if (yearSpan) {
                        yearSpan.textContent = new Date().getFullYear();
                    }
                })
                .catch(error => console.error('Error loading footer:', error));
        }
    };

    function setupNavigation() {
        const menuButton = document.getElementById('menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const iconOpen = document.getElementById('icon-open');
        const iconClose = document.getElementById('icon-close');

        if (menuButton) {
            menuButton.addEventListener('click', () => {
                const isExpanded = menuButton.getAttribute('aria-expanded') === 'true' || false;
                menuButton.setAttribute('aria-expanded', !isExpanded);
                mobileMenu.classList.toggle('hidden');
                if (iconOpen) iconOpen.classList.toggle('hidden');
                if (iconClose) iconClose.classList.toggle('hidden');
            });
        }
    }

    function setActiveLink(basePath) {
        // Chemin de la page actuelle sur le serveur. Ex: /coeur-des-braves-paroles/chansons.html
        const currentPathname = window.location.pathname;

        const navLinks = document.querySelectorAll('#desktop-menu a, #mobile-menu a');

        navLinks.forEach(link => {
            // Chemin du lien dans le menu. Ex: /coeur-des-braves-paroles/index.html
            const linkPathname = new URL(link.href).pathname;
            
            let isActive = false;

            // Comparaison directe des chemins.
            if (linkPathname === currentPathname) {
                isActive = true;
            // Si l'URL de la page ne se termine pas par .html (URL "propre"), on la rajoute pour comparer.
            } else if (`${currentPathname}.html` === linkPathname) {
                 isActive = true;
            // Cas spécial pour la page des paroles : on active le lien "Chansons"
            } else if (currentPathname.includes('/paroles/') && linkPathname.endsWith('/chansons.html')) {
                isActive = true;
            }
            
            if (isActive) {
                link.classList.add('text-green-400', 'font-bold');
                link.classList.remove('text-white', 'hover:text-gray-300');
            } else {
                link.classList.remove('text-green-400', 'font-bold');
                link.classList.add('text-white', 'hover:text-gray-300');
            }
        });
    }

    // Lance le chargement du header et du footer.
    initializeDynamicContent();
}); 