/**
 * LottoBall Web Component
 * Encapsulates the visual representation of a single Lotto ball.
 */
class LottoBall extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['number'];
    }

    attributeChangedCallback() {
        this.render();
    }

    get number() {
        return parseInt(this.getAttribute('number')) || 0;
    }

    getBallColor() {
        const num = this.number;
        if (num <= 10) return 'var(--ball-1)';
        if (num <= 20) return 'var(--ball-11)';
        if (num <= 30) return 'var(--ball-21)';
        if (num <= 40) return 'var(--ball-31)';
        return 'var(--ball-41)';
    }

    render() {
        const color = this.getBallColor();
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: ${color};
                    box-shadow: 
                        inset -4px -4px 8px rgba(0,0,0,0.3),
                        inset 4px 4px 8px rgba(255,255,255,0.3),
                        0 10px 20px rgba(0,0,0,0.2);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    font-weight: 800;
                    font-size: 1.2rem;
                    user-select: none;
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    opacity: 0;
                    transform: scale(0.5);
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }

                @keyframes popIn {
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @media (max-width: 480px) {
                    :host {
                        width: 40px;
                        height: 40px;
                        font-size: 1rem;
                    }
                }
            </style>
            ${this.number}
        `;
    }
}

customElements.define('lotto-ball', LottoBall);

/**
 * App State & Logic
 */
const ballContainer = document.getElementById('ball-container');
const historyList = document.getElementById('history-list');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');

let history = [];

function generateLottoNumbers() {
    const numbers = new Set();
    while (numbers.size < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        numbers.add(num);
    }
    return Array.from(numbers).sort((a, b) => a - b);
}

function renderBalls(numbers) {
    ballContainer.innerHTML = '';
    numbers.forEach((num, index) => {
        const ball = document.createElement('lotto-ball');
        ball.setAttribute('number', num);
        // Staggered animation
        ball.style.animationDelay = `${index * 0.1}s`;
        ballContainer.appendChild(ball);
    });
}

function addToHistory(numbers) {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    history.unshift({ numbers, time });
    
    // Keep only last 10
    if (history.length > 10) history.pop();
    
    updateHistoryUI();
}

function updateHistoryUI() {
    historyList.innerHTML = '';
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const ballsHtml = item.numbers.map(num => {
            let color = 'var(--ball-41)';
            if (num <= 10) color = 'var(--ball-1)';
            else if (num <= 20) color = 'var(--ball-11)';
            else if (num <= 30) color = 'var(--ball-21)';
            else if (num <= 40) color = 'var(--ball-31)';
            
            return `<div class="history-ball-small" style="background: ${color}">${num}</div>`;
        }).join('');
        
        historyItem.innerHTML = `
            <div class="history-numbers">${ballsHtml}</div>
            <span class="history-time">${item.time}</span>
        `;
        historyList.appendChild(historyItem);
    });
}

generateBtn.addEventListener('click', () => {
    const numbers = generateLottoNumbers();
    renderBalls(numbers);
    addToHistory(numbers);
    
    // Add a little feedback to the button
    generateBtn.style.transform = 'scale(0.95)';
    setTimeout(() => generateBtn.style.transform = '', 100);
});

clearBtn.addEventListener('click', () => {
    ballContainer.innerHTML = '<div class="placeholder-text">행운의 번호를 생성하세요</div>';
    history = [];
    updateHistoryUI();
});
