(function(){

    const API_URL = 'https://knowledge.timeflows.org/api/help/instruction';

    const RANDOM_PHRASES = [
        'Ой у лузі червона калина похилиласяяяяяяяя',
        'Кожному П____у по дрону в ї____о',
        'Смарагдове небо чекає на завтраа.......'
    ];

    let lastPhraseIndex = -1;

    function normalizeText(text){
        return (text || '')
            .replace(/\s+/g, ' ')
            .replace(/[:：]/g, '')
            .trim();
    }

    function escapeHtml(text){
        return String(text || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function findValueByCaption(captionName){
        const captions = Array.from(document.querySelectorAll('.el-caption'));

        const caption = captions.find(el =>
            normalizeText(el.textContent).toLowerCase() === normalizeText(captionName).toLowerCase()
        );

        if(!caption) return '';

        const block = caption.closest('.data-view');
        if(!block) return '';

        const safeValue = block.querySelector('.js-safe-value');
        if(safeValue) return normalizeText(safeValue.textContent);

        const value = block.querySelector('.el-value');
        if(!value) return '';

        const clone = value.cloneNode(true);

        clone.querySelectorAll(
            'a, .js-safe-value, .ob-link-copy, .ob-link-edit'
        ).forEach(el => el.remove());

        return normalizeText(clone.textContent);
    }

    function getProcessName(){
        return findValueByCaption('Процес');
    }

    function getStageName(){
        return findValueByCaption('Етап');
    }

    function renderMainMenu(){
        const content = document.getElementById('processTasksContent');
        if(!content) return;

        content.innerHTML = `
            <div class="kb-card">
                <h3>Привіт 👋</h3>

                <p>
                    Натисни кнопку нижче, щоб отримати інструкцію
                    для поточного етапу процесу.
                </p>

                <button id="loadStageInfoBtn" class="kb-main-btn">
                    Інформація про етап
                </button>

                <button id="createSupportTaskBtn" class="kb-support-btn">
                    Створити завдання на підтримку OneBox
                </button>
            </div>
        `;

        const loadBtn = document.getElementById('loadStageInfoBtn');

        if(loadBtn){
            loadBtn.addEventListener('click', function(e){
                e.preventDefault();
                requestInstruction();
            });
        }

        const supportBtn = document.getElementById('createSupportTaskBtn');

        if(supportBtn){
            supportBtn.addEventListener('click', function(e){
                e.preventDefault();

                window.open(
                    'https://vyriy.1b.app/form/0/4/',
                    '_blank'
                );
            });
        }
    }

    function bindBackButton(){
        const btn = document.getElementById('backToClippyMenu');

        if(!btn) return;

        btn.addEventListener('click', function(e){
            e.preventDefault();
            renderMainMenu();
        });
    }

    function setContentLoading(){
        const content = document.getElementById('processTasksContent');
        if(!content) return;

        content.innerHTML = `
            <div class="kb-loading">
                <div class="kb-spinner"></div>
                <div>Шукаю інструкцію для цього етапу...</div>
            </div>
        `;
    }

    function showInstruction(data, processName, stageName){
        const content = document.getElementById('processTasksContent');
        if(!content) return;

        if(!data || !data.found){
            content.innerHTML = `
                <div class="kb-card kb-error">
                    <h3>Інструкцію не знайдено</h3>

                    <p>Процес: <strong>${escapeHtml(processName)}</strong></p>
                    <p>Етап: <strong>${escapeHtml(stageName)}</strong></p>

                    <p>
                        ${escapeHtml(
                            data && data.instructions
                                ? data.instructions
                                : 'Для цього процесу та етапу поки немає інструкції.'
                        )}
                    </p>

                    <button id="backToClippyMenu" class="kb-secondary-btn">
                        ← Назад до меню
                    </button>
                </div>
            `;

            bindBackButton();
            return;
        }

        content.innerHTML = `
            <div class="kb-card">
                <div class="kb-label">Процес</div>
                <h3>${escapeHtml(data.processName || processName)}</h3>

                <div class="kb-label">Етап</div>
                <h4>${escapeHtml(data.stageName || stageName)}</h4>

                <div class="kb-label">Інструкція</div>
                <div class="kb-instruction">
                    ${escapeHtml(data.instructions || '').replaceAll('\\n', '<br>')}
                </div>

                ${
                    data.filePath
                    ? `<div class="kb-file">📎 Файл: ${escapeHtml(data.filePath)}</div>`
                    : ''
                }

                <button id="backToClippyMenu" class="kb-secondary-btn">
                    ← Назад до меню
                </button>
            </div>
        `;

        bindBackButton();
    }

    function showError(error){
        const content = document.getElementById('processTasksContent');
        if(!content) return;

        content.innerHTML = `
            <div class="kb-card kb-error">
                <h3>Помилка запиту</h3>

                <p>Не вдалося отримати інструкцію з сервера.</p>

                <small>${escapeHtml(error && error.message ? error.message : 'Невідома помилка')}</small>

                <button id="backToClippyMenu" class="kb-secondary-btn">
                    ← Назад до меню
                </button>
            </div>
        `;

        bindBackButton();
    }

    function requestInstruction(){
        const processName = getProcessName();
        const stageName = getStageName();

        console.log('[Clippy] processName:', processName);
        console.log('[Clippy] stageName:', stageName);

        setContentLoading();

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                processName: processName,
                stageName: stageName
            })
        })
        .then(response => response.json())
        .then(data => showInstruction(data, processName, stageName))
        .catch(error => showError(error));
    }

    function getRandomPhrase(){
        if(RANDOM_PHRASES.length === 0) {
            return 'Якщо потрібна допомога — натисни на мене';
        }

        if(RANDOM_PHRASES.length === 1) {
            return RANDOM_PHRASES[0];
        }

        let index;

        do {
            index = Math.floor(Math.random() * RANDOM_PHRASES.length);
        } while(index === lastPhraseIndex);

        lastPhraseIndex = index;

        return RANDOM_PHRASES[index];
    }

    function startRandomBubblePhrases(){
        setInterval(function(){
            const bubble = document.getElementById('clippyBubbleText');
            if(!bubble) return;

            const randomPhrase = getRandomPhrase();

            bubble.textContent = randomPhrase;
            bubble.classList.add('force-show');

            setTimeout(function(){
                bubble.classList.remove('force-show');
                bubble.textContent = 'Якщо потрібна допомога — натисни на мене';
            }, 9000);

        }, 60000);
    }

    function createWidget(){
        if(document.getElementById('processTasksBtn')) return;

        const btn = document.createElement('div');
        btn.id = 'processTasksBtn';
        btn.innerHTML = `
            <div class="clippyPaperclip">
                <div class="clippyEyes">
                    <span></span><span></span>
                </div>
            </div>

            <div class="clippyBubble" id="clippyBubbleText">
                Якщо потрібна допомога — натисни на мене
            </div>
        `;
        document.body.appendChild(btn);

        const panel = document.createElement('div');
        panel.id = 'processTasksPanel';
        panel.innerHTML = `
            <div class="processTasksHeader">
                <span>Скріпочка-помічник</span>
                <span id="processTasksClose">✕</span>
            </div>

            <div id="processTasksContent"></div>
        `;
        document.body.appendChild(panel);

        renderMainMenu();

        btn.addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            panel.classList.toggle('open');
        });

        document.getElementById('processTasksClose').addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            panel.classList.remove('open');
        });

        startRandomBubblePhrases();
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', createWidget);
    }else{
        createWidget();
    }

})();
