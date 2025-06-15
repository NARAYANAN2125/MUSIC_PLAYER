// DOM Elements
const musicPlayer = document.querySelector('.music-player');
const songTitle = document.querySelector('.song-title');
const artist = document.querySelector('.artist');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const currentTimeEl = document.querySelector('.current-time');
const durationEl = document.querySelector('.duration');
const playBtn = document.querySelector('#play');
const prevBtn = document.querySelector('#prev');
const nextBtn = document.querySelector('#next');
const volumeSlider = document.querySelector('.volume-slider');
const fileInput = document.querySelector('#music-file');
const showPlaylistBtn = document.querySelector('#show-playlist');
const playlistModal = document.querySelector('#playlist-modal');
const closeBtn = document.querySelector('.close-btn');
const playlistItems = document.querySelector('#playlist-items');
const searchInput = document.querySelector('#search-input');

// Audio Context
let audio = new Audio();
let isPlaying = false;
let currentSongIndex = 0;
let allMusicFiles = [];
let filteredFiles = [];

// Supported audio formats
const supportedFormats = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a'
];

// Event Listeners
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', playPrevious);
nextBtn.addEventListener('click', playNext);
volumeSlider.addEventListener('input', adjustVolume);
fileInput.addEventListener('change', handleFolderSelect);
showPlaylistBtn.addEventListener('click', showPlaylist);
closeBtn.addEventListener('click', hidePlaylist);
searchInput.addEventListener('input', filterSongs);

// Audio Event Listeners
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateDuration);
audio.addEventListener('ended', playNext);
audio.addEventListener('play', () => {
    isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
});
audio.addEventListener('pause', () => {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
});

// Functions
function togglePlay() {
    if (allMusicFiles.length === 0) return;
    
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
}

function playPrevious() {
    if (allMusicFiles.length === 0) return;
    
    currentSongIndex = (currentSongIndex - 1 + allMusicFiles.length) % allMusicFiles.length;
    loadAndPlaySong(allMusicFiles[currentSongIndex]);
}

function playNext() {
    if (allMusicFiles.length === 0) return;
    
    currentSongIndex = (currentSongIndex + 1) % allMusicFiles.length;
    loadAndPlaySong(allMusicFiles[currentSongIndex]);
}

function adjustVolume() {
    audio.volume = volumeSlider.value / 100;
}

function handleFolderSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Filter for audio files
    const audioFiles = files.filter(file => {
        const extension = file.name.split('.').pop().toLowerCase();
        return supportedFormats.includes(file.type) || 
               ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension);
    });

    // Sort files by name
    audioFiles.sort((a, b) => a.name.localeCompare(b.name));

    // Clear existing files and add new ones
    allMusicFiles = audioFiles;
    filteredFiles = [];
    
    // Update playlist
    updatePlaylist();
    
    // Play first song if there are any files
    if (allMusicFiles.length > 0) {
        currentSongIndex = 0;
        loadAndPlaySong(allMusicFiles[0]);
    }
}

function loadAndPlaySong(file) {
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.play();
    
    // Update song info
    songTitle.textContent = file.name.replace(/\.[^/.]+$/, "");
    
    // Try to get artist name from folder structure
    const pathParts = file.webkitRelativePath.split('/');
    artist.textContent = pathParts.length > 1 ? pathParts[pathParts.length - 2] : "Unknown Artist";
    
    // Update active song in playlist
    updateActiveSong();
}

function updateProgress() {
    const { currentTime, duration } = audio;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    
    // Update time display
    currentTimeEl.textContent = formatTime(currentTime);
}

function updateDuration() {
    durationEl.textContent = formatTime(audio.duration);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showPlaylist() {
    playlistModal.style.display = 'block';
    searchInput.value = '';
    updatePlaylist();
}

function hidePlaylist() {
    playlistModal.style.display = 'none';
}

function updatePlaylist() {
    playlistItems.innerHTML = '';
    const filesToShow = filteredFiles.length > 0 ? filteredFiles : allMusicFiles;
    
    if (filesToShow.length === 0) {
        const li = document.createElement('li');
        li.textContent = "No songs found matching your search.";
        li.style.textAlign = 'center';
        li.style.color = '#666';
        playlistItems.appendChild(li);
        return;
    }
    
    filesToShow.forEach((file, index) => {
        const li = document.createElement('li');
        const pathParts = file.webkitRelativePath.split('/');
        const artistName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : "Unknown Artist";
        
        li.innerHTML = `
            <span class="song-number">${index + 1}</span>
            <div class="song-info">
                <div class="song-title">${file.name.replace(/\.[^/.]+$/, "")}</div>
                <div class="song-artist">${artistName}</div>
            </div>
        `;
        
        if (index === currentSongIndex) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', () => {
            currentSongIndex = index;
            loadAndPlaySong(file);
        });
        
        playlistItems.appendChild(li);
    });
}

function filterSongs() {
    const searchTerm = searchInput.value.toLowerCase();
    filteredFiles = allMusicFiles.filter(file => {
        const fileName = file.name.toLowerCase();
        const pathParts = file.webkitRelativePath.split('/');
        const artistName = pathParts.length > 1 ? pathParts[pathParts.length - 2].toLowerCase() : "";
        return fileName.includes(searchTerm) || artistName.includes(searchTerm);
    });
    updatePlaylist();
}

function updateActiveSong() {
    const items = playlistItems.querySelectorAll('li');
    items.forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Progress bar click handler
progressBar.addEventListener('click', (e) => {
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}); 