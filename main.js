/**
 * Alimjang Generator Logic (Cloudflare Workers Version)
 */

const photoInput = document.getElementById('photo-input');
const photoPreview = document.getElementById('photo-preview');
const dropZone = document.getElementById('drop-zone');
const generateBtn = document.getElementById('generate-btn');
const btnText = generateBtn.querySelector('.btn-text');
const loader = generateBtn.querySelector('.loader');
const resultContent = document.getElementById('result-content');
const copyBtn = document.getElementById('copy-btn');

let uploadedFiles = [];

// --- File Handling ---

photoInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--alim-secondary)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--alim-border)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--alim-border)';
    handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (uploadedFiles.length + newFiles.length > 10) {
        alert('최대 10장까지만 업로드 가능합니다.');
        return;
    }

    newFiles.forEach(file => {
        uploadedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-img';
            photoPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

// --- AI Generation (via Worker) ---

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

generateBtn.addEventListener('click', async () => {
    const childName = document.getElementById('child-name').value;
    const keywords = document.getElementById('keywords').value;
    const referenceText = document.getElementById('reference-text').value;

    if (!childName || !keywords) {
        alert('아이 이름과 상황 키워드를 입력해주세요.');
        return;
    }

    try {
        setLoading(true);

        const imageDatas = await Promise.all(
            uploadedFiles.map(file => fileToBase64(file))
        );

        // Call the Cloudflare Worker endpoint
        const response = await fetch('/generateAlimjang', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                childName,
                keywords,
                referenceText,
                images: imageDatas
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
        }

        const generatedText = data.text;
        resultContent.innerHTML = `<p>${generatedText.replace(/\n/g, '<br>')}</p>`;

    } catch (error) {
        console.error('Error:', error);
        alert('생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    btnText.style.opacity = isLoading ? '0' : '1';
    loader.hidden = !isLoading;
    if (isLoading) {
        resultContent.innerHTML = '<p class="placeholder-text">AI가 열심히 알림장을 작성하고 있습니다... ✨</p>';
    }
}

// --- Utility ---

copyBtn.addEventListener('click', () => {
    const text = resultContent.innerText;
    if (text && text !== '정보를 입력하고 생성 버튼을 눌러주세요.') {
        navigator.clipboard.writeText(text).then(() => {
            const originalIcon = copyBtn.innerText;
            copyBtn.innerText = '✅';
            setTimeout(() => copyBtn.innerText = originalIcon, 2000);
        });
    }
});

// --- PWA Service Worker Registration ---

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('Service Worker registered', reg);
                // Check for updates
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New content is available; please refresh.
                                console.log('New content is available; please refresh.');
                                if (confirm('새로운 버전이 업데이트되었습니다. 페이지를 새로고침하시겠습니까?')) {
                                    window.location.reload();
                                }
                            }
                        }
                    };
                };
            })
            .catch(err => console.error('Service Worker registration failed', err));
    });
}
