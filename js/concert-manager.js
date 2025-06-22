document.addEventListener('DOMContentLoaded', () => {
    const concertSelector = document.getElementById('concert-selector');
    const newConcertBtn = document.getElementById('new-concert-btn');
    const saveConcertBtn = document.getElementById('save-concert-btn');
    const renameConcertBtn = document.getElementById('rename-concert-btn');
    const deleteConcertBtn = document.getElementById('delete-concert-btn');
    const songFilter = document.getElementById('song-filter');
    const availableSongsContainer = document.getElementById('available-songs');
    const concertSongsContainer = document.getElementById('concert-songs');
    const concertTitleElement = document.getElementById('concert-title');
    const generatePageBtn = document.getElementById('generate-page-btn');

    const STORAGE_KEY = 'coeurDesBravesConcerts';
    let allSongs = {};
    let concerts = {};
    let currentConcertName = null;

    async function initialize() {
        await loadSongs();
        loadConcertsFromStorage();
        populateConcertSelector();
        setupDragAndDrop();
        setupEventListeners();
        
        // Load first concert if available
        if (Object.keys(concerts).length > 0) {
            concertSelector.selectedIndex = 0;
            handleConcertSelect();
        } else {
            updateUIForNoConcert();
        }
    }

    async function loadSongs() {
        try {
            const response = await fetch('songs.json');
            if (!response.ok) throw new Error('Network response was not ok.');
            allSongs = await response.json();
        } catch (error) {
            console.error('Failed to load songs.json:', error);
            alert('Erreur: Impossible de charger le fichier songs.json. Assurez-vous qu\'il est accessible.');
        }
    }

    function loadConcertsFromStorage() {
        concerts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }

    function saveConcertsToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(concerts));
    }

    function createSongItem(id, title) {
        const div = document.createElement('div');
        div.className = 'song-item bg-white dark:bg-gray-800';
        div.dataset.id = id;
        div.textContent = title;
        return div;
    }

    function populateAvailableSongs(concertSongIds = []) {
        availableSongsContainer.innerHTML = '';
        const concertSongSet = new Set(concertSongIds);
        Object.entries(allSongs)
            .sort(([, a], [, b]) => a.title.localeCompare(b.title))
            .forEach(([id, song]) => {
                if (!concertSongSet.has(id)) {
                    availableSongsContainer.appendChild(createSongItem(id, song.title));
                }
            });
    }

    function populateConcertSongs(songIds = []) {
        concertSongsContainer.innerHTML = '';
        songIds.forEach(id => {
            if (allSongs[id]) {
                concertSongsContainer.appendChild(createSongItem(id, allSongs[id].title));
            }
        });
    }

    function populateConcertSelector() {
        concertSelector.innerHTML = '';
        if (Object.keys(concerts).length === 0) {
            const option = new Option('Aucun concert créé', '');
            option.disabled = true;
            concertSelector.add(option);
            return;
        }
        Object.keys(concerts)
            .sort()
            .forEach(name => concertSelector.add(new Option(name, name)));
    }
    
    function updateUIForNoConcert() {
        concertTitleElement.textContent = "Aucun concert sélectionné";
        [saveConcertBtn, renameConcertBtn, deleteConcertBtn, generatePageBtn].forEach(btn => btn.disabled = true);
        populateAvailableSongs();
        populateConcertSongs();
    }
    
    function updateUIForSelectedConcert() {
        concertTitleElement.textContent = currentConcertName;
        [saveConcertBtn, renameConcertBtn, deleteConcertBtn, generatePageBtn].forEach(btn => btn.disabled = false);
        const songIds = concerts[currentConcertName] || [];
        populateAvailableSongs(songIds);
        populateConcertSongs(songIds);
    }
    
    function handleConcertSelect() {
        currentConcertName = concertSelector.value;
        if (currentConcertName) {
            updateUIForSelectedConcert();
        } else {
            updateUIForNoConcert();
        }
    }

    function setupDragAndDrop() {
        const sharedOptions = {
            group: 'concert',
            animation: 150,
            ghostClass: 'sortable-ghost'
        };
        new Sortable(availableSongsContainer, sharedOptions);
        new Sortable(concertSongsContainer, sharedOptions);
    }

    function setupEventListeners() {
        concertSelector.addEventListener('change', handleConcertSelect);

        newConcertBtn.addEventListener('click', () => {
            const name = prompt('Entrez le nom du nouveau concert:');
            if (name && !concerts[name]) {
                concerts[name] = [];
                currentConcertName = name;
                saveConcertsToStorage();
                populateConcertSelector();
                concertSelector.value = name;
                updateUIForSelectedConcert();
            } else if (name) {
                alert('Un concert avec ce nom existe déjà.');
            }
        });

        saveConcertBtn.addEventListener('click', () => {
            if (!currentConcertName) return;
            const songIds = [...concertSongsContainer.children].map(item => item.dataset.id);
            concerts[currentConcertName] = songIds;
            saveConcertsToStorage();
            alert(`Concert "${currentConcertName}" sauvegardé !`);
        });
        
        renameConcertBtn.addEventListener('click', () => {
            if (!currentConcertName) return;
            const newName = prompt('Entrez le nouveau nom du concert:', currentConcertName);
            if (newName && newName !== currentConcertName && !concerts[newName]) {
                concerts[newName] = concerts[currentConcertName];
                delete concerts[currentConcertName];
                currentConcertName = newName;
                saveConcertsToStorage();
                populateConcertSelector();
                concertSelector.value = newName;
                concertTitleElement.textContent = newName;
            } else if (newName) {
                alert('Ce nom est invalide ou déjà utilisé.');
            }
        });

        deleteConcertBtn.addEventListener('click', () => {
            if (!currentConcertName || !confirm(`Êtes-vous sûr de vouloir supprimer le concert "${currentConcertName}" ?`)) {
                return;
            }
            delete concerts[currentConcertName];
            currentConcertName = null;
            saveConcertsToStorage();
            populateConcertSelector();

            if (Object.keys(concerts).length > 0) {
                concertSelector.selectedIndex = 0;
                handleConcertSelect();
            } else {
                updateUIForNoConcert();
            }
        });
        
        songFilter.addEventListener('input', () => {
            const filterText = songFilter.value.toLowerCase();
            availableSongsContainer.childNodes.forEach(item => {
                const songTitle = item.textContent.toLowerCase();
                item.style.display = songTitle.includes(filterText) ? '' : 'none';
            });
        });

        generatePageBtn.addEventListener('click', () => {
            if (!currentConcertName) return;
            const songIds = concerts[currentConcertName] || [];
            if (songIds.length === 0) {
                alert('Ce concert est vide. Ajoutez des chansons avant de générer la page.');
                return;
            }

            const concertPage = window.open('', '_blank');
            const repoName = location.pathname.split('/')[1] || 'coeur-des-braves-site';

            let html = `
                <!DOCTYPE html><html lang="fr"><head><title>Concert: ${currentConcertName}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: sans-serif; padding: 2rem; }
                    h1 { font-size: 2rem; margin-bottom: 2rem; text-align: center; }
                    ol { list-style-position: inside; }
                    li { margin-bottom: 1rem; font-size: 1.25rem; }
                    a { color: #007bff; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
                </head><body>
                <h1>${currentConcertName}</h1>
                <ol>`;
            
            songIds.forEach(id => {
                const song = allSongs[id];
                if(song) {
                    const songPageUrl = `/${repoName}/paroles/index.html?song=${id}`;
                    html += `<li><a href="${songPageUrl}" target="_blank">${song.title}</a></li>`;
                }
            });

            html += `</ol></body></html>`;
            concertPage.document.write(html);
            concertPage.document.close();
        });
    }

    initialize();
}); 