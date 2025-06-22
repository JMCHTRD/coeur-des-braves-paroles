document.addEventListener('DOMContentLoaded', () => {
    const concertSelector = document.getElementById('concert-selector');
    const newConcertBtn = document.getElementById('new-concert-btn');
    const downloadConcertsBtn = document.getElementById('download-concerts-btn');
    const renameConcertBtn = document.getElementById('rename-concert-btn');
    const deleteConcertBtn = document.getElementById('delete-concert-btn');
    const songFilter = document.getElementById('song-filter');
    const availableSongsContainer = document.getElementById('available-songs');
    const concertSongsContainer = document.getElementById('concert-songs');
    const concertTitleElement = document.getElementById('concert-title');
    const generatePageBtn = document.getElementById('generate-page-btn');
    const publishConcertBtn = document.getElementById('publish-concert-btn');
    const unpublishBtn = document.getElementById('unpublish-btn');

    const CONCERTS_STORAGE_KEY = 'coeurDesBravesConcerts';
    const ACTIVE_CONCERT_STORAGE_KEY = 'coeurDesBravesActiveConcert';

    let allSongs = {};
    let concertData = { active: null, lists: {} };
    let currentConcertName = null;

    async function initialize() {
        await loadSongs();
        await loadConcertsFromFile();
        populateConcertSelector();
        setupDragAndDrop();
        setupEventListeners();
        
        // Load first concert if available
        if (Object.keys(concertData.lists).length > 0) {
            concertSelector.selectedIndex = 0;
            handleConcertSelect();
        } else {
            updateUIForNoConcert();
        }
        downloadConcertsBtn.disabled = false; // Le bouton de téléchargement doit toujours être actif
    }

    async function loadSongs() {
        try {
            const response = await fetch('songs.json', { cache: 'no-cache' });
            if (!response.ok) throw new Error('Network response was not ok.');
            allSongs = await response.json();
        } catch (error) {
            console.error('Failed to load songs.json:', error);
            alert("Erreur: Impossible de charger le fichier songs.json. Assurez-vous qu'il est accessible.");
        }
    }

    async function loadConcertsFromFile() {
        try {
            const response = await fetch('concerts.json', { cache: 'no-cache' });
            if (!response.ok) {
                concertData = { active: null, lists: {} };
                return;
            }
            const data = await response.json();
            // Gérer l'ancien format et le convertir
            if (data && !data.hasOwnProperty('lists')) {
                concertData = { active: null, lists: data };
            } else {
                concertData = data || { active: null, lists: {} };
            }
        } catch (error) {
            console.error('Failed to load concerts.json:', error);
            alert('Erreur: Impossible de charger le fichier des concerts. Un fichier vide sera utilisé.');
            concertData = { active: null, lists: {} };
        }
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
        const selectedValue = concertSelector.value;
        concertSelector.innerHTML = '';
        const activeConcert = concertData.active;

        if (Object.keys(concertData.lists).length === 0) {
            const option = new Option('Aucun concert créé', '');
            option.disabled = true;
            concertSelector.add(option);
            return;
        }
        Object.keys(concertData.lists)
            .sort()
            .forEach(name => {
                const option = new Option(name, name);
                if (name === activeConcert) {
                    option.textContent = `${name} (Publié)`;
                }
                concertSelector.add(option);
            });
        
        if (selectedValue) {
            concertSelector.value = selectedValue;
        }
    }
    
    function updateUIForNoConcert() {
        concertTitleElement.textContent = "Aucun concert sélectionné";
        [renameConcertBtn, deleteConcertBtn, generatePageBtn, publishConcertBtn].forEach(btn => btn.disabled = true);
        populateAvailableSongs();
        populateConcertSongs();
    }
    
    function updateUIForSelectedConcert() {
        concertTitleElement.textContent = currentConcertName;
        [renameConcertBtn, deleteConcertBtn, generatePageBtn, publishConcertBtn].forEach(btn => btn.disabled = false);
        const songIds = concertData.lists[currentConcertName] || [];
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
            if (name && !concertData.lists[name]) {
                concertData.lists[name] = [];
                currentConcertName = name;
                populateConcertSelector();
                concertSelector.value = name;
                updateUIForSelectedConcert();
            } else if (name) {
                alert('Un concert avec ce nom existe déjà.');
            }
        });

        downloadConcertsBtn.addEventListener('click', () => {
            // S'assurer que le concert en cours d'édition est bien à jour avant de télécharger
            if (currentConcertName) {
                const songIds = [...concertSongsContainer.children].map(item => item.dataset.id);
                concertData.lists[currentConcertName] = songIds;
            }

            const updatedJsonString = JSON.stringify(concertData, null, 4);
            const blob = new Blob([updatedJsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'concerts.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        renameConcertBtn.addEventListener('click', () => {
            if (!currentConcertName) return;
            const newName = prompt('Entrez le nouveau nom du concert:', currentConcertName);
            if (newName && newName !== currentConcertName && !concertData.lists[newName]) {
                // Sauvegarde de l'ordre actuel avant de changer le nom
                const songIds = [...concertSongsContainer.children].map(item => item.dataset.id);
                concertData.lists[currentConcertName] = songIds;

                concertData.lists[newName] = concertData.lists[currentConcertName];
                delete concertData.lists[currentConcertName];

                if (concertData.active === currentConcertName) {
                    concertData.active = newName;
                }

                currentConcertName = newName;
                
                populateConcertSelector();
                concertSelector.value = newName;
                concertTitleElement.textContent = newName;
            } else if (newName) {
                alert('Ce nom est invalide ou déjà utilisé.');
            }
        });

        deleteConcertBtn.addEventListener('click', () => {
            if (!currentConcertName) return;
            if (currentConcertName === concertData.active) {
                concertData.active = null;
            }
            if (!confirm(`Êtes-vous sûr de vouloir supprimer le concert "${currentConcertName}" ?`)) {
                return;
            }
            delete concertData.lists[currentConcertName];
            currentConcertName = null;
            
            populateConcertSelector();

            if (Object.keys(concertData.lists).length > 0) {
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

        publishConcertBtn.addEventListener('click', () => {
            if (!currentConcertName) return;
            concertData.active = currentConcertName;
            populateConcertSelector();
            alert(`"${currentConcertName}" est marqué comme publié. N'oubliez pas de télécharger le fichier et de le mettre à jour sur GitHub.`);
        });

        unpublishBtn.addEventListener('click', () => {
            concertData.active = null;
            populateConcertSelector();
            alert("Le mode concert est désactivé. N'oubliez pas de télécharger le fichier et de le mettre à jour sur GitHub.");
        });

        generatePageBtn.addEventListener('click', () => {
            if (!currentConcertName) return;
            const songIds = concertData.lists[currentConcertName] || [];
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