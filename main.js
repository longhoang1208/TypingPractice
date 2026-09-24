

const textBox       = document.getElementById("text-box");
const hiddenInput   = document.getElementById("hidden-input");
const typingContent = document.getElementById("typing-content");

const maxLength   = 30;
let displayedList = [];
let typedList = [];
let wordList  = {"words": []}; 
let currentWordIndex = 0;
let correctCount = 0;
let totalTypedCount = 0;

const cursor = document.createElement("span");
cursor.id = "cursor";

const countdownDisplay = document.getElementById("countdown")
const options = document.querySelectorAll('#select-time .time-option')

let totalSecond = 30;
countdownDisplay.textContent = `${totalSecond}s`;

let startCountdown = false;
let remain = totalSecond;
let countdownTimer = null;

const errorMaxLen = 10;


options.forEach(option => {
    option.addEventListener('click', () => {
        // Delete all 'active' classes
        options.forEach(opt => opt.classList.remove('active'));

        // Add 'active' class to the selected option
        option.classList.add('active');

        // Get data-value
        const selectedValue = option.getAttribute('data-value');

        countdownDisplay.textContent = selectedValue;
        totalSecond = selectedValue;
    });
});



fetch("./english_1k.json")
    .then(res => res.json())
    .then(data => {
        wordList = data;
        initTyping();
    });


function initTyping() {
    displayedList     = [];
    currentWordIndex  = 0;
    hiddenInput.value = "";

    hiddenInput.disabled = false;
    typingContent.style.fontSize = "3.5cqw";

    cursor.style.opacity   = 1;
    cursor.style.animation = "blink 1s infinite";

    while (displayedList.length < maxLength && wordList.words.length > 0) {
        getRandomWord();
    }
    mapTypingContent();
}


function resetTimer() {
    startCountdown = false;
    remain = totalSecond;
}


function getRandomWord() {
    word = wordList.words[
        Math.floor(Math.random() * wordList.words.length)
    ];
    displayedList.push(word);
}


function mapTypingContent() {
    if (wordList.words.length) {
        typingContent.innerHTML = displayedList.map((word) => {
            let chars = [...word].map(char => `<span class="char">${char}</span>`).join("");
            return `<span class="word">${chars}</span>`;
        }).join('<span class="space"> </span>');
    }
    updateCursor();
}


function updateCursor() {
    const wordElements  = typingContent.querySelectorAll(".word");
    const currentWordEl = wordElements[currentWordIndex];

    const chars = currentWordEl.querySelectorAll(".char");
    const pos   = hiddenInput.value.length;
    const extraSpan = currentWordEl.querySelector(".extra");

    const containerRect = typingContent.getBoundingClientRect();
    let targetRect;
    let atEnd = false;

    if (pos < chars.length) {
        targetRect = chars[pos].getBoundingClientRect();
    } else if (extraSpan && extraSpan.textContent.length > 0) {
        // đang gõ thừa -> đặt cursor sau đoạn extra
        targetRect = extraSpan.getBoundingClientRect();
        atEnd = true;
    } else if (chars.length > 0) {
        targetRect = chars[chars.length - 1].getBoundingClientRect();
        atEnd = true;
    } else {
        targetRect = currentWordEl.getBoundingClientRect();
    }

    const left = atEnd ? targetRect.right : targetRect.left;

    cursor.style.left   = `${left - containerRect.left}px`;
    cursor.style.top    = `${targetRect.top - containerRect.top}px`;
    cursor.style.height = `${targetRect.height}px`;

    if (cursor.parentElement !== typingContent) {
        typingContent.appendChild(cursor);
    }
}


function finished() {
    hiddenInput.disabled = true;
    cursor.style.opacity = 0;

    const WPM = Math.round(((correctCount/5)/(totalSecond/60)));
    const ACC = totalTypedCount > 0
    ? Math.round((correctCount / totalTypedCount) * 100)
    : 0;
    
    typingContent.textContent = `${WPM} WPM | ${ACC}% Acc`;
    typingContent.style.fontSize = "6cqw";
    
    countdownDisplay.textContent = `${remain}s`;
    resetTimer();

    correctCount = 0;
    totalTypedCount = 0;

    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
}


function startTimer() {
    if (countdownTimer) return;

    remain --;
    countdownDisplay.textContent = `${remain}s`;
    
    countdownTimer = setInterval(() => {
        if (startCountdown) {
            remain--;
            countdownDisplay.textContent = `${remain}s`;
        
            if (remain <= 0) {
                finished();
                clearInterval(countdownTimer);
            }
        }
    }, 1000);
}


textBox.addEventListener("click", () => {
    countdownDisplay.textContent = `${remain}s`;
    initTyping();
    resetTimer();
    countdownDisplay.textContent = `${remain}s`;
    hiddenInput.focus();
});
window.addEventListener("load", () => hiddenInput.focus());


// Nhấn space -> chuyển sang từ tiếp theo, không thể gõ lại
hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === " " || e.code === "Space") {
        e.preventDefault();  // Ngăn trình duyệt chèn khoảng trắng vào input

        let typed = hiddenInput.value;

        // Danh sách các từ hiện tại trên văn bản gốc
        const wordElements = typingContent.querySelectorAll(".word");

        // Từ đang được gõ trên văn bản gốc (DOM)
        const currentWordEl = wordElements[currentWordIndex];

        // Từ mẫu tương ứng (String)
        const targetWord = displayedList[currentWordIndex];

        // Danh sách các ký tự trong từ đang gõ
        const chars = currentWordEl.querySelectorAll(".char");
        
        const typedTrimmed = typed.trim();

        chars.forEach((char, i) => {
            if (i >= typedTrimmed.length) {
                char.style.color   = "red";
                char.style.opacity = 0.5;
            }
        })

        // Đếm số ký tự gõ đúng
        for (let i = 0; i < typedTrimmed.length; i++) {
            if (i < targetWord.length && typedTrimmed[i] === targetWord[i]) {
                correctCount++;
            }
        }

        // Nếu từ gõ đúng hoàn toàn -> cộng thêm 1 điểm cho phím Space hợp lệ
        if (typedTrimmed === targetWord) {
            correctCount ++;
        }

        // Cộng tổng số ký tự đã gõ (bao gồm phím Space (+1))
        totalTypedCount += typedTrimmed.length + 1;

        currentWordIndex ++;    // tăng index để chuyển sang từ mói
        hiddenInput.value = ""; // reset input value

        // Reset văn bản mới khi đã gõ đủ số từ
        if (currentWordIndex >= maxLength) {
            initTyping();
        }

        updateCursor();
    }
})

hiddenInput.addEventListener('input', () => {
    let typed = hiddenInput.value;

    // Danh sách các từ hiện tại trên văn bản gốc
    const wordElements = typingContent.querySelectorAll(".word");

    // Từ đang được gõ trên văn bản gốc (DOM)
    const currentWordEl = wordElements[currentWordIndex];

    // Từ mẫu tương ứng (String)
    const targetWord = displayedList[currentWordIndex];

    // Danh sách các ký tự trong từ đang gõ
    const chars = currentWordEl.querySelectorAll(".char");
    
    // Chặn gõ thêm nếu đã vượt quá giới hạn ký tự thừa cho phép
    // (không chặn dấu space kết thúc từ, để vẫn có thể chuyển từ)
    
    // Số từ gõ sư tối đa
    const maxAllowedLen = targetWord.length + errorMaxLen;
    if (typed.length > maxAllowedLen) {
        typed = typed.slice(0, maxAllowedLen);
        hiddenInput.value = typed;
    }

    // Tạo span cho chuỗi ký tự bị gõ thừa
    let extraSpan = currentWordEl.querySelector(".extra");
    if (!extraSpan) {
        extraSpan = document.createElement("span");
        extraSpan.className = "extra";
        extraSpan.style.color = "red";
        extraSpan.style.opacity = 0.5;
        currentWordEl.appendChild(extraSpan);
    }

    // Bắt đầu đếm ngược thời gian đánh máy
    if (typed && !startCountdown) {
        startCountdown = true;
        startTimer();
        cursor.style.animation = "none";
    }

    // Trong khi đang gõ chữ
    if (currentWordIndex < maxLength) {
        // Luôn luôn reset về màu gốc
        chars.forEach(char => {
            char.style.color = "rgba(179, 178, 178, 0.465)";
            char.style.opacity = 1;
        });

        // Highlight đúng sai
        for (let i=0; i < Math.min(typed.length, targetWord.length); i++) {
            if (i < targetWord.length) {
                if (typed[i] === targetWord[i]) {
                    chars[i].style.color = "yellow"; // Đúng
                } else {
                    chars[i].style.color = "red";    // Sai
                    chars[i].style.opacity = 0.5;
                }
            }
        }

        if (typed.length > targetWord.length) {
            const extra = typed.substring(
                targetWord.length,
                Math.min(typed.length, targetWord.length + errorMaxLen)
            );

            extraSpan.textContent = extra;
        } else {
            extraSpan.textContent = "";
        }
    }

    updateCursor();
});
