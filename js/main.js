document.addEventListener('DOMContentLoaded', function () {
    const rootPath = document.documentElement.getAttribute('data-root-path') || '.';

    // Détermine si nous sommes à la racine (ex: index.html) ou dans un sous-dossier (ex: paroles/)
    // Un chemin rootPath de '.' signifie que nous sommes à la racine.
    const pathPrefix = rootPath === '.' ? '' : rootPath + '/';

    const initializeDynamicContent = () => {
        const headerPath = `${pathPrefix}includes/_header.html`;
        const footerPath = `${pathPrefix}includes/_footer.html`;
        
        const headerPlaceholder = document.getElementById('header-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (headerPlaceholder) {
            fetch(headerPath)
                .then(response => response.text())
                .then(data => {
                    headerPlaceholder.innerHTML = data;
                    updateHeaderPaths(headerPlaceholder, pathPrefix);
                    setupNavigation();
                    setActiveLink();
                })
                .catch(error => console.error('Error loading header:', error));
        }

        if (footerPlaceholder) {
            fetch(footerPath)
                .then(response => response.text())
                .then(data => {
                    footerPlaceholder.innerHTML = data;
                    updateFooterPaths(footerPlaceholder, pathPrefix);
                    const yearSpan = footerPlaceholder.querySelector('#year');
                    if (yearSpan) {
                        yearSpan.textContent = new Date().getFullYear();
                    }
                })
                .catch(error => console.error('Error loading footer:', error));
        }
    };

    // Attend que les polices soient chargées avant d'initialiser le contenu dynamique.
    // C'est la correction clé pour éviter les problèmes de calcul de hauteur.
    document.fonts.ready.then(initializeDynamicContent);

    function updateHeaderPaths(container, prefix) {
        if (!prefix) return; // Pas besoin de modifier si on est à la racine

        // Met à jour les liens (<a>)
        const links = container.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            // On ne modifie que les liens relatifs simples
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('/')) {
                link.setAttribute('href', `${prefix}${href}`);
            }
        });

        // Met à jour les images (<img>)
        const images = container.querySelectorAll('img[src]');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('/')) {
                img.setAttribute('src', `${prefix}${src}`);
            }
        });
    }
    
    function updateFooterPaths(container, prefix) {
        if (!prefix) return;
        // Pour l'instant, le footer n'a pas de lien à mettre à jour, mais la fonction est là au cas où.
    }

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
                setTimeout(adjustMainPadding, 50);
            });
        }
        
        setTimeout(adjustMainPadding, 50);
        window.addEventListener('resize', adjustMainPadding);
    }
    
    function adjustMainPadding() {
        const navElement = document.getElementById('main-nav');
        const mainContentElement = document.getElementById('main-content');
        if (navElement && mainContentElement) {
            const navHeight = navElement.offsetHeight;
            mainContentElement.style.paddingTop = navHeight + 'px';
        }
    }

    function setActiveLink() {
        const currentPath = window.location.pathname.endsWith('/') 
            ? window.location.pathname + 'index.html' 
            : window.location.pathname;
        
        const navLinks = document.querySelectorAll('#desktop-menu a, #mobile-menu a');

        navLinks.forEach(link => {
            const linkUrl = new URL(link.getAttribute('href'), window.location.origin);
            const linkPath = linkUrl.pathname;
            
            let isActive = false;

            if (linkPath === currentPath) {
                isActive = true;
            } else if (currentPath.includes('/paroles/') && linkPath.endsWith('/chansons.html')) {
                isActive = true;
            }
            
            if (isActive) {
                link.classList.add('font-semibold');
            } else {
                link.classList.remove('font-semibold');
            }
        });
    }
}); 