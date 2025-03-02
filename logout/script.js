// Global variables
let currentAudio = null;
let isYouTubeMode = false;
let youtubePlayer = null;
let tracks = [];
let currentTrack = null;
let currentPreviewTimer = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load track data from CSV
    loadTracks();
    
    // Setup media toggle
    const mediaToggle = document.getElementById('media-toggle');
    mediaToggle.addEventListener('change', function() {
        isYouTubeMode = this.checked;
        if (currentTrack && isYouTubeMode) {
            playYouTubeVideo(currentTrack.youtubelink);
        } else if (currentTrack) {
            closeYouTubePlayer();
            playAudioTrack(currentTrack.mp3filepath, false);
        } else {
            closeYouTubePlayer();
        }
    });
    
    // Setup close button for YouTube player
    document.getElementById('close-youtube').addEventListener('click', closeYouTubePlayer);
    
    // Load YouTube API
    loadYouTubeAPI();
    
    // Update artist name
    document.getElementById('artist-name').textContent = 'Alex10kd';
    
    // Set up social media links
    setupSocialLinks();
});

// Set up social media links (update these URLs with your actual links)
function setupSocialLinks() {
    const socialLinks = {
        'spotify': 'https://open.spotify.com/artist/yourID',
        'youtube': 'https://youtube.com/c/yourChannel',
        'soundcloud': 'https://soundcloud.com/yourProfile',
        'facebook': 'https://facebook.com/yourPage',
        'instagram': 'https://instagram.com/yourHandle'
    };
    
    document.querySelectorAll('.social-link').forEach(link => {
        const platform = link.title.toLowerCase();
        if (socialLinks[platform]) {
            link.href = socialLinks[platform];
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
    });
}

// Load YouTube IFrame API
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube API callback
window.onYouTubeIframeAPIReady = function() {
    youtubePlayer = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'playsinline': 1,
            'controls': 1,
            'autoplay': 0
        },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
};

// Handle YouTube player state changes
function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
        // Video ended, find next track
        playNextTrack();
    }
}

// Load tracks from CSV
function loadTracks() {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.textContent = 'Loading tracks...';
    
    // Use fetch API to get CSV with proper encoding
    fetch('tracks.csv')
        .then(response => response.text())
        .then(csvText => {
            // Remove BOM if present
            if (csvText.charCodeAt(0) === 0xFEFF) {
                csvText = csvText.substring(1);
            }
            
            Papa.parse(csvText, {
                header: true,
                complete: function(results) {
                    if (results.data) {
                        // Filter out empty rows or rows with minimal data
                        tracks = results.data.filter(track => 
                            track.imagefilepath && 
                            track.songname && 
                            Object.values(track).some(val => val !== '')
                        );
                        
                        renderVerticalTracks(tracks);
                        loadingIndicator.style.display = 'none';
                    } else {
                        console.error('No valid data found in CSV');
                        loadingIndicator.textContent = 'No tracks found. Loading samples...';
                        createSampleTracks();
                    }
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    loadingIndicator.textContent = 'Error loading tracks. Loading samples...';
                    createSampleTracks();
                }
            });
        })
        .catch(error => {
            console.error('Error fetching CSV:', error);
            loadingIndicator.textContent = 'Error fetching tracks. Loading samples...';
            createSampleTracks();
        });
}

// Create sample tracks if CSV fails to load
function createSampleTracks() {
    tracks = [];
    
    // Create varied number of tracks for each album
    const albumData = [
        {name: 'Album 1', tracks: 13},
        {name: 'Album 2', tracks: 10},
        {name: 'Album 3', tracks: 11},
        {name: 'Album 4', tracks: 12},
        {name: 'Album 5', tracks: 9},
        {name: 'Album 6', tracks: 10},
        {name: 'Album 7', tracks: 13},
        {name: 'Album 8', tracks: 8},
        {name: 'Singles', tracks: 6},
        {name: 'Unreleased', tracks: 4}
    ];
    
    let trackCounter = 1;
    albumData.forEach(album => {
        for (let i = 1; i <= album.tracks; i++) {
            tracks.push({
                imagefilepath: `images/sample${(trackCounter % 4) + 1}.jpg`,
                mp3filepath: album.name === 'Unreleased' ? '' : `audio/sample${(trackCounter % 3) + 1}.mp3`,
                songname: `${album.name} - Track ${i}`,
                youtubelink: i % 3 === 0 ? 'dQw4w9WgXcQ' : '',
                album: album.name,
                indexonalbum: i.toString()
            });
            trackCounter++;
        }
    });
    
    renderVerticalTracks(tracks);
    document.getElementById('loading-indicator').style.display = 'none';
}

function renderVerticalTracks(tracks) {
    const container = document.getElementById('tracks-master-container');
    container.innerHTML = '';
    
    // Group tracks by album
    const albumGroups = {};
    tracks.forEach(track => {
        const albumName = track.album || 'Singles';
        if (!albumGroups[albumName]) {
            albumGroups[albumName] = [];
        }
        albumGroups[albumName].push(track);
    });
    
    // Get unique album names in order of appearance in the CSV
    const albumOrder = [];
    tracks.forEach(track => {
        const albumName = track.album || 'Singles';
        if (!albumOrder.includes(albumName)) {
            albumOrder.push(albumName);
        }
    });
    
    // Make sure 'Unreleased' is always at the end if present
    if (albumOrder.includes('Unreleased')) {
        albumOrder.splice(albumOrder.indexOf('Unreleased'), 1);
        albumOrder.push('Unreleased');
    }
    
    // Find max track count to standardize column height
    const MAX_TRACKS_PER_ALBUM = 13; // Fixed height for all columns
    
    // Create a column for each album
    albumOrder.forEach(albumName => {
        const albumTracks = albumGroups[albumName] || [];
        
        // Skip empty albums
        if (albumTracks.length === 0 && albumName !== 'Unreleased') return;
        
        // Sort tracks by indexonalbum
        albumTracks.sort((a, b) => {
            const indexA = parseInt(a.indexonalbum) || 999;
            const indexB = parseInt(b.indexonalbum) || 999;
            return indexA - indexB;
        });
        
        // Create album column
        const albumColumn = document.createElement('div');
        albumColumn.className = 'album-column';
        
        // Create vertical album title
        const albumTitle = document.createElement('div');
        albumTitle.className = 'vertical-album-title';
        albumTitle.textContent = albumName;
        albumColumn.appendChild(albumTitle);
        
        // Create tracks container
        const albumTracksContainer = document.createElement('div');
        albumTracksContainer.className = 'album-tracks';
        
        // Create track boxes for this album
        for (let i = 0; i < MAX_TRACKS_PER_ALBUM; i++) {
            if (i < albumTracks.length) {
                // We have a track for this position
                const track = albumTracks[i];
                
                const trackBox = document.createElement('div');
                trackBox.className = 'track-box';
                if (!track.mp3filepath && !track.youtubelink) {
                    trackBox.classList.add('unreleased');
                }
                
                const imageUrl = track.imagefilepath || (track.youtubelink && `https://img.youtube.com/vi/${track.youtubelink}/hqdefault.jpg`) || 'path/to/default/image.jpg';
                
                trackBox.setAttribute('data-mp3', track.mp3filepath || '');
                trackBox.setAttribute('data-youtube', track.youtubelink || '');
                trackBox.setAttribute('data-name', track.songname);
                trackBox.setAttribute('data-album', albumName);
                trackBox.setAttribute('data-index', track.indexonalbum);
                
                trackBox.innerHTML = `
                    <img src="${imageUrl}" alt="${track.songname}" class="track-image">
                    <div class="track-info">
                        <div class="track-name">${track.songname}</div>
                    </div>
                `;
                
                // Only add play functionality if track has media
                if (track.mp3filepath || track.youtubelink) {
                    trackBox.addEventListener('click', () => playTrack(track, false));
                    trackBox.addEventListener('mouseenter', () => {
                        if (!currentTrack || currentTrack.songname !== track.songname) {
                            playTrack(track, true);
                        }
                    });
                    trackBox.addEventListener('mouseleave', () => {
                        if (currentPreviewTimer) {
                            clearTimeout(currentPreviewTimer);
                            currentPreviewTimer = null;
                            
                            // Only stop if we're in preview mode and it's this track
                            const currentlyPlayingBox = document.querySelector('.track-box.playing');
                            if (currentlyPlayingBox === trackBox) {
                                const audioPlayer = document.getElementById('audio-player');
                                audioPlayer.pause();
                                audioPlayer.currentTime = 0;
                                trackBox.classList.remove('playing');
                            }
                        }
                    });
                }
                
                albumTracksContainer.appendChild(trackBox);
            } else {
                // Create placeholder for missing tracks to maintain column height
                const placeholder = document.createElement('div');
                placeholder.className = 'track-placeholder';
                albumTracksContainer.appendChild(placeholder);
            }
        }
        
        albumColumn.appendChild(albumTracksContainer);
        container.appendChild(albumColumn);
    });
}

// Play a track
function playTrack(track, previewOnly = false) {
    currentTrack = track;
    
    // Update now playing text
    document.getElementById('now-playing-text').textContent = `Now Playing: ${track.songname}`;
    
    // Remove playing class from all tracks
    document.querySelectorAll('.track-box.playing').forEach(box => {
        box.classList.remove('playing');
    });
    
    // Find the current track box and add playing class
    const trackBoxes = document.querySelectorAll('.track-box');
    let currentTrackBox = null;
    
    for (const box of trackBoxes) {
        if (box.getAttribute('data-name') === track.songname) {
            box.classList.add('playing');
            currentTrackBox = box;
            
            // Scroll into view if not in preview mode
            if (!previewOnly) {
                box.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            break;
        }
    }
    
   if (previewOnly) {
    // For preview, play the full song
    if (currentPreviewTimer) {
        clearTimeout(currentPreviewTimer);
        currentPreviewTimer = null;
    }
    
    playAudioTrack(track.mp3filepath, true);
    
    // No timeout - let it play fully
}
 else {
        // For full play
        if (currentPreviewTimer) {
            clearTimeout(currentPreviewTimer);
            currentPreviewTimer = null;
        }
        
        if (isYouTubeMode && track.youtubelink) {
            playYouTubeVideo(track.youtubelink);
        } else {
            closeYouTubePlayer();
            playAudioTrack(track.mp3filepath, false);
        }
    }
}

// Play audio track
function playAudioTrack(mp3Path, isPreview = false) {
    if (!mp3Path) {
        console.warn('No MP3 path provided');
        return;
    }
    
    const audioPlayer = document.getElementById('audio-player');
    
    // Stop current audio if playing
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    
    // Set new source and play
    audioPlayer.src = mp3Path;
    audioPlayer.volume = isPreview ? 0.5 : 0.8; // Lower volume for previews
    
    // Play the audio and handle any errors
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error('Audio playback failed:', error);
        });
    }
    
    // Setup next track handling if not preview
    if (!isPreview) {
        audioPlayer.onended = playNextTrack;
    } else {
        audioPlayer.onended = null;
    }
}

// Play YouTube video
function playYouTubeVideo(youtubeLink) {
    if (!youtubeLink) {
        console.warn('No YouTube link provided');
        return;
    }
    
    // Stop audio if playing
    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    
    // Extract video ID
    let videoId = youtubeLink;
    
    // Handle full URLs
    if (youtubeLink.includes('youtube.com') || youtubeLink.includes('youtu.be')) {
        try {
            const url = new URL(youtubeLink);
            if (youtubeLink.includes('youtube.com')) {
                videoId = url.searchParams.get('v');
            } else if (youtubeLink.includes('youtu.be')) {
                videoId = url.pathname.substring(1);
            }
        } catch (e) {
            console.error('Invalid YouTube URL:', e);
        }
    }
    
    if (!videoId) {
        console.error('Could not extract YouTube video ID');
        return;
    }
    
    // Show YouTube player container
    const playerContainer = document.getElementById('youtube-player-container');
    playerContainer.classList.remove('hidden');
    
    // Load and play video
    if (youtubePlayer && youtubePlayer.loadVideoById) {
        youtubePlayer.loadVideoById(videoId);
    }
	}

// Close YouTube player
function closeYouTubePlayer() {
    const playerContainer = document.getElementById('youtube-player-container');
    playerContainer.classList.add('hidden');
    
    // Stop YouTube video
    if (youtubePlayer && youtubePlayer.stopVideo) {
        youtubePlayer.stopVideo();
    }
    
    // If there's a current track, resume audio
    if (currentTrack && currentTrack.mp3filepath && !isYouTubeMode) {
        playAudioTrack(currentTrack.mp3filepath, false);
    }
}

// Play next track
function playNextTrack() {
    if (!currentTrack || !tracks.length) return;
    
    // Find current track index
    const currentIndex = tracks.findIndex(track => track.songname === currentTrack.songname);
    
    if (currentIndex === -1) return;iew
    
    // Find next track with media
    let nextIndex = currentIndex + 1;
    let foundNext = false;
    
    for (let i = 0; i < tracks.length; i++) {
        if (nextIndex >= tracks.length) {
            nextIndex = 0; // Loop back to beginning
        }
        
        const nextTrack = tracks[nextIndex];
        if ((isYouTubeMode && nextTrack.youtubelink) || (!isYouTubeMode && nextTrack.mp3filepath)) {
            foundNext = true;
            break;
        }
        
        nextIndex++;
    }
    
    if (foundNext) {
        playTrack(tracks[nextIndex], false);
    }
}