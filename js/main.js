document.addEventListener('DOMContentLoaded', function () {
    // Le nom du dépôt est utilisé pour construire les chemins absolus.
    const basePath = ''; // Plus de nom de dépôt en dur

    const initializeDynamicContent = () => {
        const headerPath = `/includes/_header.html`;
        const footerPath = `/includes/_footer.html`;
        
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
                    setActiveLink();
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
                // On recalcule le padding après l'animation du menu pour être sûr.
                setTimeout(adjustMainPadding, 50); 
            });
        }
        
        // Ajustement du padding au chargement (après chargement des images/polices) et sur redimensionnement.
        window.addEventListener('load', adjustMainPadding);
        window.addEventListener('resize', adjustMainPadding);
    }
    
    function adjustMainPadding() {
        const navElement = document.getElementById('main-nav');
        const mainContentElement = document.getElementById('main-content');
        if (navElement && mainContentElement) {
            const navHeight = navElement.offsetHeight;
            mainContentElement.style.paddingTop = `${navHeight}px`;
        }
    }

    function setActiveLink() {
        // Chemin de la page actuelle sur le serveur. Ex: /coeur-des-braves-paroles/chansons.html
        const currentPath = window.location.pathname;

        const navLinks = document.querySelectorAll('#desktop-menu a, #mobile-menu a');

        navLinks.forEach(link => {
            // Chemin du lien dans le menu. Ex: /chansons.html
            const linkPath = new URL(link.href).pathname;
            
            // On vérifie si le chemin de la page actuelle se termine par le chemin du lien.
            // Cela fonctionne car "/coeur-des-braves-paroles/chansons.html".endsWith("/chansons.html") est vrai.
            let isActive = currentPath.endsWith(linkPath);

            // Cas spécial pour la page d'accueil, car /repo/ et /repo/index.html sont équivalents
            if (linkPath.endsWith('/index.html') && (currentPath.endsWith('/') || currentPath.endsWith('/index.html'))) {
                 const repoNameFromPath = currentPath.split('/')[1];
                 if (currentPath === `/${repoNameFromPath}/` || currentPath === `/${repoNameFromPath}/index.html`) {
                    isActive = true;
                 }
            }
            
            // Cas spécial pour la page des paroles : on active le lien "Chansons"
            if (currentPath.includes('/paroles/') && linkPath.endsWith('/chansons.html')) {
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