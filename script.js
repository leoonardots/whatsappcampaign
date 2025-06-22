    const WEBHOOK_URL = 'https://n8nwh.dnsp.net/webhook/FU3jB09cZEtW3UAk8fevYcwlfn3s2RN5pLmCTSDPb9yoWzo3';
    let contentCounter = 0;

    // WhatsApp formatting functions
    function applyFormatting(textarea, format) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        if (selectedText === '') {
            // No text selected, insert format markers
            let markers = '';
            switch(format) {
                case 'bold': markers = '**'; break;
                case 'italic': markers = '*'; break;
                case 'strikethrough': markers = '~'; break;
                case 'monospace': markers = '```'; break;
                case 'quote': markers = '> '; break;
            }
            
            if (format === 'quote') {
                // For quotes, add at the beginning of the line
                const lines = textarea.value.split('\n');
                const currentLineIndex = textarea.value.substring(0, start).split('\n').length - 1;
                lines[currentLineIndex] = '> ' + lines[currentLineIndex];
                textarea.value = lines.join('\n');
                textarea.setSelectionRange(start + 2, start + 2);
            } else {
                const newText = textarea.value.substring(0, start) + markers + markers + textarea.value.substring(end);
                textarea.value = newText;
                textarea.setSelectionRange(start + markers.length, start + markers.length);
            }
        } else {
            // Text is selected, wrap it with format markers
            let formattedText = '';
            switch(format) {
                case 'bold': formattedText = `*${selectedText}*`; break;
                case 'italic': formattedText = `_${selectedText}_`; break;
                case 'strikethrough': formattedText = `~${selectedText}~`; break;
                case 'monospace': formattedText = `\`\`\`${selectedText}\`\`\``; break;
                case 'quote': formattedText = `> ${selectedText}`; break;
            }
            
            const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
            textarea.value = newText;
            textarea.setSelectionRange(start, start + formattedText.length);
        }
        
        textarea.focus();
        updatePreview(textarea);
        updateProgressBar();
    }

    function updatePreview(textarea) {
        const contentId = textarea.name.split('-')[2];
        const preview = document.getElementById(`preview-${contentId}`);
        if (!preview) return;
        
        let text = textarea.value;
        
        // Convert WhatsApp formatting to HTML
        text = text
            // Bold: *text*
            .replace(/\*([^*]+)\*/g, '<span class="bold">$1</span>')
            // Italic: _text_
            .replace(/_([^_]+)_/g, '<span class="italic">$1</span>')
            // Strikethrough: ~text~
            .replace(/~([^~]+)~/g, '<span class="strikethrough">$1</span>')
            // Monospace: ```text```
            .replace(/```([^`]+)```/g, '<span class="monospace">$1</span>')
            // Quote: > text
            .replace(/^> (.+)$/gm, '<div class="quote">$1</div>');
        
        preview.innerHTML = text || '';
    }

    // Progress bar functionality
    function updateProgressBar() {
        const nomeCampanha = document.getElementById('nomeCampanha').value.trim();
        const dataInicio = document.getElementById('dataInicio').value;
        const dataTermino = document.getElementById('dataTermino').value;
        const contentItems = document.querySelectorAll('.content-item');
        
        let progress = 0;
        
        // Step 1: Nome da campanha (25%)
        if (nomeCampanha) progress += 25;
        
        // Step 2: Datas (25%)
        if (dataInicio && dataTermino) progress += 25;
        
        // Step 3: Pelo menos um conteúdo (50%)
        let hasContent = false;
        contentItems.forEach(item => {
            const text = item.querySelector('textarea')?.value?.trim();
            const fileInputs = item.querySelectorAll('input[type="file"]');
            const hasFile = Array.from(fileInputs).some(input => input.files.length > 0);
            
            if ((text && text !== '') || hasFile) {
                hasContent = true;
            }
        });
        
        if (hasContent) progress += 50;
        
        document.getElementById('progressBar').style.width = progress + '%';
    }

    // Sticky progress bar on scroll
    window.addEventListener('scroll', function() {
        const progressContainer = document.getElementById('progressBarContainer');
        if (window.scrollY > 100) {
            progressContainer.classList.add('visible');
        } else {
            progressContainer.classList.remove('visible');
        }
    });

    // Popup system
    function showPopup(type, title, message, buttons = []) {
        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        
        const popup = document.createElement('div');
        popup.className = `popup-content ${type}`;
        
        const header = document.createElement('div');
        header.className = `popup-header ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-triangle' : 
                    'fa-info-circle';
        
        header.innerHTML = `
            <i class="fas ${icon}"></i>
            <h3>${title}</h3>
        `;
        
        const body = document.createElement('div');
        body.className = 'popup-body';
        body.innerHTML = message;
        
        const footer = document.createElement('div');
        footer.className = 'popup-footer';
        
        if (buttons.length === 0) {
            buttons = [{
                text: 'OK',
                class: 'primary',
                action: () => closePopup(overlay)
            }];
        }
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `popup-btn ${btn.class || 'primary'}`;
            button.textContent = btn.text;
            button.onclick = btn.action;
            footer.appendChild(button);
        });
        
        popup.appendChild(header);
        popup.appendChild(body);
        popup.appendChild(footer);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePopup(overlay);
            }
        });
        
        return overlay;
    }

    function closePopup(overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease-in-out';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }

    function showErrorPopup(errors) {
        const errorList = errors.map(error => `<li>${error}</li>`).join('');
        const message = `<ul>${errorList}</ul>`;
        showPopup('error', 'Corrija os seguintes pontos:', message);
    }

    function showSuccessPopup(message, callback) {
        const buttons = [
            {
                text: 'OK',
                class: 'primary',
                action: () => {
                    closePopup(document.querySelector('.popup-overlay'));
                    if (callback) callback();
                }
            }
        ];
        showPopup('success', 'Sucesso!', message, buttons);
    }

    // Character counter for campaign name
    document.addEventListener('DOMContentLoaded', function() {
        const nomeInput = document.getElementById('nomeCampanha');
        const nomeCount = document.getElementById('nomeCount');
        
        nomeInput.addEventListener('input', function() {
            const length = this.value.length;
            nomeCount.textContent = `${length}/100`;
            
            nomeCount.classList.remove('warning', 'error');
            if (length > 80) {
                nomeCount.classList.add('warning');
            }
            if (length >= 100) {
                nomeCount.classList.add('error');
            }
            
            updateProgressBar();
        });
    });

    function toggleFormattingHelp(contentId) {
        const help = document.getElementById(`help-${contentId}`);
        if (help.style.display === 'none' || help.style.display === '') {
            help.style.display = 'block';
        } else {
            help.style.display = 'none';
        }
    }

    function changeFile(id, tipo) {
        document.getElementById(`file-${tipo}-${id}`).click();
    }

    function removeFile(id, tipo) {
        const fileInput = document.getElementById(`file-${tipo}-${id}`);
        const container = document.getElementById(`${tipo}-${id}`);
        
        fileInput.value = '';
        
        // Restore file upload area
        container.innerHTML = `
            <div class="file-upload" onclick="document.getElementById('file-${tipo}-${id}').click()">
                <input type="file" id="file-${tipo}-${id}" 
                       name="conteudo-${tipo}-${id}" 
                       accept="${tipo === 'video' ? 'video/*' : 'image/*'}" 
                       style="display:none" 
                       onchange="previewFile(this, ${id}, '${tipo}')">
                <div class="file-upload-content">
                    <div class="file-upload-icon">
                        <i class="fas fa-${tipo === 'video' ? 'video' : 'cloud-upload-alt'}"></i>
                    </div>
                    <div class="file-upload-text">Selecione ${tipo === 'video' ? 'um vídeo' : 'uma imagem'}</div>
                    <div class="file-upload-hint">${tipo === 'video' ? 'MP4, AVI até 50MB' : 'JPG, PNG até 10MB'}</div>
                </div>
            </div>
        `;
        
        updateProgressBar();
    }

    function addContent() {
        contentCounter++;
        const contentContainer = document.getElementById('contentContainer');

        const contentItem = document.createElement('div');
        contentItem.className = 'content-item';
        contentItem.id = `content-${contentCounter}`;

        contentItem.innerHTML = `
            <div class="content-item-header">
                <div class="content-type-selector">
                    <button type="button" class="type-btn active" onclick="selectContentType(event, ${contentCounter}, 'texto')">
                        <i class="fas fa-font"></i> Texto
                    </button>
                    <button type="button" class="type-btn" onclick="selectContentType(event, ${contentCounter}, 'imagem')">
                        <i class="fas fa-image"></i> Imagem
                    </button>
                    <button type="button" class="type-btn" onclick="selectContentType(event, ${contentCounter}, 'video')">
                        <i class="fas fa-video"></i> Vídeo
                    </button>
                </div>
                <div class="action-buttons">
                    <div class="move-buttons-group">
                        <button type="button" class="move-btn tooltip" onclick="moveContent(${contentCounter}, 'up')">
                            <i class="fas fa-arrow-up"></i>
                            <span class="tooltiptext">Mover para cima</span>
                        </button>
                        <button type="button" class="move-btn tooltip" onclick="moveContent(${contentCounter}, 'down')">
                            <i class="fas fa-arrow-down"></i>
                            <span class="tooltiptext">Mover para baixo</span>
                        </button>
                    </div>
                    <button type="button" class="remove-content tooltip" onclick="removeContent(${contentCounter})">
                        <i class="fas fa-trash"></i>
                        <span class="tooltiptext">Remover conteúdo</span>
                    </button>
                </div>
            </div>

            <div class="content-input active" id="texto-${contentCounter}">
                <div class="text-editor-container">
                    <div class="formatting-toolbar">
                        <button type="button" class="format-btn tooltip" onclick="applyFormatting(document.querySelector('textarea[name=\\'conteudo-texto-${contentCounter}\\']'), 'bold')">
                            <i class="fas fa-bold"></i>
                            <span class="tooltiptext">Negrito (*texto*)</span>
                        </button>
                        <button type="button" class="format-btn tooltip" onclick="applyFormatting(document.querySelector('textarea[name=\\'conteudo-texto-${contentCounter}\\']'), 'italic')">
                            <i class="fas fa-italic"></i>
                            <span class="tooltiptext">Itálico (_texto_)</span>
                        </button>
                        <button type="button" class="format-btn tooltip" onclick="applyFormatting(document.querySelector('textarea[name=\\'conteudo-texto-${contentCounter}\\']'), 'strikethrough')">
                            <i class="fas fa-strikethrough"></i>
                            <span class="tooltiptext">Riscado (~texto~)</span>
                        </button>
                        <button type="button" class="format-btn tooltip" onclick="applyFormatting(document.querySelector('textarea[name=\\'conteudo-texto-${contentCounter}\\']'), 'monospace')">
                            <i class="fas fa-code"></i>
                            <span class="tooltiptext">Monoespaçado (\`\`\`texto\`\`\`)</span>
                        </button>
                        <button type="button" class="format-btn tooltip" onclick="applyFormatting(document.querySelector('textarea[name=\\'conteudo-texto-${contentCounter}\\']'), 'quote')">
                            <i class="fas fa-quote-left"></i>
                            <span class="tooltiptext">Citação (> texto)</span>
                        </button>
                    </div>
                    <textarea name="conteudo-texto-${contentCounter}" 
                             class="text-editor"
                             placeholder="Digite sua mensagem aqui... 

💡 Dicas:
• Use emojis para tornar a mensagem mais atrativa
• Mantenha o texto claro e objetivo
• Inclua uma chamada para ação"
                             rows="6" 
                             maxlength="1000"
                             oninput="updateCharacterCount(${contentCounter}); updatePreview(this); updateProgressBar();"></textarea>
                </div>
                <div class="character-count" id="textCount-${contentCounter}">0/1000</div>
                <button type="button" class="formatting-help-toggle" onclick="toggleFormattingHelp(${contentCounter})">
                    Ver guia de formatação
                </button>
                <div id="help-${contentCounter}" class="formatting-help" style="display: none;">
                    <strong>Formatação WhatsApp:</strong><br>
                    • <strong>*texto*</strong> = Negrito<br>
                    • <strong>_texto_</strong> = Itálico<br>
                    • <strong>~texto~</strong> = Riscado<br>
                    • <strong>\`\`\`texto\`\`\`</strong> = Monoespaçado<br>
                    • <strong>> texto</strong> = Citação
                </div>
                <div class="preview-container">
                    <div class="preview-label">
                        <i class="fab fa-whatsapp"></i>
                        Preview WhatsApp:
                    </div>
                    <div class="whatsapp-preview" id="preview-${contentCounter}"></div>
                </div>
            </div>

            <div class="content-input" id="imagem-${contentCounter}">
                <div class="file-upload" onclick="document.getElementById('file-imagem-${contentCounter}').click()">
                    <input type="file" id="file-imagem-${contentCounter}" 
                           name="conteudo-imagem-${contentCounter}" 
                           accept="image/*" 
                           style="display:none" 
                           onchange="previewFile(this, ${contentCounter}, 'imagem')">
                    <div class="file-upload-content">
                        <div class="file-upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="file-upload-text">Selecione uma imagem</div>
                        <div class="file-upload-hint">JPG, PNG até 10MB</div>
                    </div>
                </div>
            </div>

            <div class="content-input" id="video-${contentCounter}">
                <div class="file-upload" onclick="document.getElementById('file-video-${contentCounter}').click()">
                    <input type="file" id="file-video-${contentCounter}" 
                           name="conteudo-video-${contentCounter}" 
                           accept="video/*" 
                           style="display:none" 
                           onchange="previewFile(this, ${contentCounter}, 'video')">
                    <div class="file-upload-content">
                        <div class="file-upload-icon">
                            <i class="fas fa-video"></i>
                        </div>
                        <div class="file-upload-text">Selecione um vídeo</div>
                        <div class="file-upload-hint">MP4, AVI até 50MB</div>
                    </div>
                </div>
            </div>
        `;

        contentContainer.appendChild(contentItem);
        updateMoveButtonVisibility();
        updateProgressBar();
    }

    function updateCharacterCount(id) {
        const textarea = document.querySelector(`textarea[name="conteudo-texto-${id}"]`);
        const counter = document.getElementById(`textCount-${id}`);
        const length = textarea.value.length;
        
        counter.textContent = `${length}/1000`;
        
        counter.classList.remove('warning', 'error');
        if (length > 800) {
            counter.classList.add('warning');
        }
        if (length >= 1000) {
            counter.classList.add('error');
        }
    }

    function removeContent(id) {
        const contentItem = document.getElementById(`content-${id}`);
        if (contentItem) {
            contentItem.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                contentItem.remove();
                updateMoveButtonVisibility();
                updateProgressBar();
            }, 300);
        }
    }

    function selectContentType(event, id, type) {
        const buttons = document.querySelectorAll(`#content-${id} .type-btn`);
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.closest('.type-btn').classList.add('active');

        const inputs = document.querySelectorAll(`#content-${id} .content-input`);
        inputs.forEach(input => input.classList.remove('active'));
        document.getElementById(`${type}-${id}`).classList.add('active');
        
        updateProgressBar();
    }

    function previewFile(input, id, tipo) {
        const container = document.getElementById(`${tipo}-${id}`);
        const file = input.files[0];
        
        if (file) {
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            const maxSize = tipo === 'video' ? 50 : 10;
            
            if (fileSize > maxSize) {
                showPopup('error', 'Arquivo muito grande!', 
                    `O arquivo selecionado tem ${fileSize}MB. O tamanho máximo permitido é ${maxSize}MB.`);
                input.value = '';
                return;
            }
            
            // Create file URL for preview
            const fileURL = URL.createObjectURL(file);
            
            // Replace file upload area with preview
            container.innerHTML = `
                <div class="media-preview">
                    <input type="file" id="file-${tipo}-${id}" 
                           name="conteudo-${tipo}-${id}" 
                           accept="${tipo === 'video' ? 'video/*' : 'image/*'}" 
                           style="display:none" 
                           onchange="previewFile(this, ${id}, '${tipo}')">
                    ${tipo === 'video' ? 
                        `<video src="${fileURL}" muted>
                            Seu navegador não suporta vídeos.
                         </video>
                         <div class="video-play-icon">
                            <i class="fas fa-play"></i>
                         </div>` : 
                        `<img src="${fileURL}" alt="Preview da imagem" crossOrigin="anonymous">`
                    }
                    <div class="media-overlay">
                        <div class="media-actions">
                            <button type="button" class="media-btn change tooltip" onclick="changeFile(${id}, '${tipo}')">
                                <i class="fas fa-edit"></i>
                                <span class="tooltiptext">Alterar ${tipo}</span>
                            </button>
                            <button type="button" class="media-btn remove tooltip" onclick="removeFile(${id}, '${tipo}')">
                                <i class="fas fa-trash"></i>
                                <span class="tooltiptext">Remover ${tipo}</span>
                            </button>
                        </div>
                        <div class="media-info">
                            ${file.name} (${fileSize} MB)
                        </div>
                    </div>
                </div>
            `;
            
            // Copy the file to the hidden input
            const hiddenInput = document.getElementById(`file-${tipo}-${id}`);
            const dt = new DataTransfer();
            dt.items.add(file);
            hiddenInput.files = dt.files;
            
        }
        
        updateProgressBar();
    }

    function updateMoveButtonVisibility() {
        const contentItems = document.querySelectorAll('.content-item');
        contentItems.forEach((item, index) => {
            const moveUpBtn = item.querySelector('.move-btn[onclick*="\'up\'"]');
            const moveDownBtn = item.querySelector('.move-btn[onclick*="\'down\'"]');
            const moveButtonsGroup = item.querySelector('.move-buttons-group');

            if (moveButtonsGroup) {
                if (contentItems.length <= 1) {
                    moveButtonsGroup.style.display = 'none';
                } else {
                    moveButtonsGroup.style.display = 'flex';
                }
            }

            if (moveUpBtn) {
                moveUpBtn.disabled = index === 0;
            }

            if (moveDownBtn) {
                moveDownBtn.disabled = index === contentItems.length - 1;
            }
        });
    }

    function moveContent(id, direction) {
        const contentItem = document.getElementById(`content-${id}`);
        const contentContainer = document.getElementById('contentContainer');
        
        if (direction === 'up') {
            const previousSibling = contentItem.previousElementSibling;
            if (previousSibling) {
                contentContainer.insertBefore(contentItem, previousSibling);
            }
        } else if (direction === 'down') {
            const nextSibling = contentItem.nextElementSibling;
            if (nextSibling) {
                contentContainer.insertBefore(nextSibling, contentItem);
            }
        }
        updateMoveButtonVisibility();
    }

    document.addEventListener('DOMContentLoaded', () => {
        addContent();
        
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('dataInicio').min = local;
        document.getElementById('dataTermino').min = local;

        // Add event listeners for progress tracking
        document.getElementById('dataInicio').addEventListener('change', function() {
            document.getElementById('dataTermino').min = this.value;
            updateProgressBar();
        });
        document.getElementById('dataTermino').addEventListener('change', updateProgressBar);
    });

    document.getElementById('campanhaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const erros = [];

        const nomeCampanha = document.getElementById('nomeCampanha').value.trim();
        const dataInicioEl = document.getElementById('dataInicio');
        const dataTerminoEl = document.getElementById('dataTermino');
        const dataInicio = new Date(dataInicioEl.value);
        const dataTermino = new Date(dataTerminoEl.value);

        if (!nomeCampanha) erros.push('O nome da campanha é obrigatório.');
        if (!dataInicioEl.value) erros.push('A data de início da campanha é obrigatória.');
        if (!dataTerminoEl.value) erros.push('A data de término da campanha é obrigatória.');

        if (dataInicioEl.value && dataTerminoEl.value && dataTermino <= dataInicio) {
            erros.push('A data de término deve ser posterior à data de início.');
        }

        const contentItems = document.querySelectorAll('.content-item');
        if (contentItems.length === 0) {
            erros.push('Adicione pelo menos um conteúdo à campanha.');
        }

        let algumConteudoPreenchido = false;

        contentItems.forEach((item, index) => {
            const text = item.querySelector('textarea')?.value?.trim();
            const fileInputs = item.querySelectorAll('input[type="file"]');
            const temArquivo = Array.from(fileInputs).some(input => input.files.length > 0);

            if ((text && text !== '') || temArquivo) {
                algumConteudoPreenchido = true;
            }
        });

        if (!algumConteudoPreenchido) {
            erros.push('Preencha pelo menos um conteúdo (texto, imagem ou vídeo).');
        }

        if (erros.length > 0) {
            showErrorPopup(erros);
            return;
        }

        const campanhaData = await coletarDadosCampanha();
        await enviarParaWebhook(campanhaData);
    });

    async function coletarDadosCampanha() {
        const nomeCampanha = document.getElementById('nomeCampanha').value.trim();
        const dataInicio = document.getElementById('dataInicio').value;
        const dataTermino = document.getElementById('dataTermino').value;
    
        const conteudos = [];
        const items = document.querySelectorAll('.content-item');
    
        for (let item of items) {
            const itemId = item.id.split('-')[1];
            const activeBtn = item.querySelector('.type-btn.active');
            const tipo = activeBtn.textContent.includes('Texto') ? 'texto' :
                         activeBtn.textContent.includes('Imagem') ? 'imagem' : 'video';
    
            let conteudo = '';
            if (tipo === 'texto') {
                const texto = item.querySelector(`textarea[name="conteudo-texto-${itemId}"]`);
                conteudo = texto.value.trim();
            } else {
                const fileInput = item.querySelector(`input[name="conteudo-${tipo}-${itemId}"]`);
                if (fileInput && fileInput.files.length > 0) {
                    conteudo = await converterParaBase64(fileInput.files[0]);
                }
            }
    
            if (conteudo) {
                conteudos.push({ tipo, conteudo });
            }
        }
    
        return {
            nomeCampanha,
            dataInicio,
            dataTermino,
            conteudos,
            timestamp: new Date().toISOString()
        };
    }
    
    function converterParaBase64(arquivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(arquivo);
        });
    }

    async function enviarParaWebhook(dados) {
        const btn = document.querySelector('.submit-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btn.disabled = true;

        try {
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

            // Success animation
            btn.innerHTML = '<i class="fas fa-check"></i> Campanha Criada!';
            btn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            
            showSuccessPopup('Campanha enviada com sucesso! A página será recarregada.', () => {
                location.reload();
            });
            
        } catch (err) {
            console.error(err);
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro no Envio';
            btn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            
            showPopup('error', 'Erro no Envio', 
                'Falha no envio da campanha. Verifique sua conexão com a internet e tente novamente.', 
                [{
                    text: 'Tentar Novamente',
                    class: 'primary',
                    action: () => {
                        closePopup(document.querySelector('.popup-overlay'));
                        btn.innerHTML = original;
                        btn.style.background = '';
                        btn.disabled = false;
                    }
                }]
            );
        }
    }

    // Add CSS animation for slide out
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);