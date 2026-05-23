/**
 * Alimjang Generator Logic
 * Handles file uploads, UI interactions, and Gemini API integration.
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

// --- AI Generation ---

async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

generateBtn.addEventListener('click', async () => {
    const apiKey = document.getElementById('api-key').value;
    const childName = document.getElementById('child-name').value;
    const keywords = document.getElementById('keywords').value;
    const referenceText = document.getElementById('reference-text').value;

    if (!apiKey) {
        alert('Gemini API Key를 입력해주세요.');
        return;
    }
    if (!childName || !keywords) {
        alert('아이 이름과 상황 키워드를 입력해주세요.');
        return;
    }

    try {
        setLoading(true);

        const imageParts = await Promise.all(
            uploadedFiles.map(file => fileToGenerativePart(file))
        );

        const prompt = `
            당신은 따뜻하고 세심한 어린이집 선생님입니다. 
            다음 정보를 바탕으로 학부모님께 보낼 알림장 문장을 작성해주세요.

            1. 아이 이름: ${childName}
            2. 상황 키워드: ${keywords}
            3. 참조할 기존 문장/말투: ${referenceText}

            [지침]
            - 첨부된 사진의 분위기와 아이의 표정을 설명에 녹여주세요.
            - 키워드를 자연스럽게 문장으로 풀어주세요.
            - 말투는 정중하면서도 다정하게, 학부모님이 안심하고 기분 좋아지도록 작성해주세요.
            - 너무 길지 않게, 하지만 진정성이 느껴지도록 작성해주세요.
            - '참조할 기존 문장'이 있다면 그 말투나 형식을 최대한 반영해주세요.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        ...imageParts
                    ]
                }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const generatedText = data.candidates[0].content.parts[0].text;
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
