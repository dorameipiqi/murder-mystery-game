// 游戏状态
let gameState = {
    currentScreen: 'title',
    collectedClues: [],
    characterInteractions: {},
    searchedLocations: [],
    questionsAsked: 0,
    totalQuestions: 30,
    selectedSuspect: null,
    gameCompleted: false,
    currentLocation: null,
    evidenceFound: [],
    conversationDepth: {}
};

// 屏幕切换
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
}

// 初始化游戏
function initGame() {
    // 开始游戏按钮
    document.getElementById('startGame').addEventListener('click', () => {
        showScreen('gameScreen');
        updateUI();
    });

    // 搜证按钮
    document.getElementById('searchEvidence').addEventListener('click', () => {
        showSearchScreen();
    });

    // 返回主游戏按钮
    document.getElementById('backToMain').addEventListener('click', () => {
        showScreen('gameScreen');
    });

    // 场景搜索按钮事件
    document.querySelectorAll('.location-card').forEach(card => {
        card.addEventListener('click', () => {
            const locationId = card.dataset.location;
            searchLocation(locationId);
        });
    });

    // 关闭搜证详情
    document.getElementById('closeLocationDetail').addEventListener('click', () => {
        showSearchScreen();
    });

    // 角色卡片点击事件
    document.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('click', () => {
            const characterId = card.dataset.character;
            startDialog(characterId);
        });
    });

    // 查看线索按钮
    document.getElementById('showClues').addEventListener('click', () => {
        showClueScreen();
    });

    // 关闭线索按钮
    document.getElementById('closeClues').addEventListener('click', () => {
        showScreen('gameScreen');
    });

    // 推理按钮
    document.getElementById('makeDeduction').addEventListener('click', () => {
        showDeductionScreen();
    });

    // 结束对话按钮
    document.getElementById('endDialog').addEventListener('click', () => {
        showScreen('gameScreen');
        updateUI();
    });

    // 推理界面按钮
    document.getElementById('backToGame').addEventListener('click', () => {
        showScreen('gameScreen');
    });

    document.getElementById('submitDeduction').addEventListener('click', () => {
        submitDeduction();
    });

    // 重新开始按钮
    document.getElementById('restartGame').addEventListener('click', () => {
        restartGame();
    });

    // 嫌疑人选择
    document.querySelectorAll('.suspect-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.suspect-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            gameState.selectedSuspect = option.dataset.suspect;
            checkDeductionReady();
        });
    });

    // 推理文本输入（已移除）
    // document.getElementById('reasoningText').addEventListener('input', () => {
    //     checkDeductionReady();
    // });

    // 加载角色对话数据
    loadCharacterData();
}

// 检查推理是否准备就绪
function checkDeductionReady() {
    const suspect = gameState.selectedSuspect;
    const submitBtn = document.getElementById('submitDeduction');
    
    if (suspect) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// 更新UI
function updateUI() {
    // 更新线索计数
    document.getElementById('clueCount').textContent = gameState.collectedClues.length;
    
    // 更新角色卡片状态
    Object.keys(gameData.characters).forEach(charId => {
        const card = document.querySelector(`[data-character="${charId}"]`);
        const interactions = gameState.characterInteractions[charId] || { questionsAsked: 0 };
        
        // 更新问题计数
        const questionSpan = card.querySelector('.questions-asked span');
        questionSpan.textContent = interactions.questionsAsked;
        
        // 标记完成状态
        if (interactions.questionsAsked >= 6) {
            card.classList.add('completed');
        }
    });

    // 检查是否可以进行推理
    const deductionBtn = document.getElementById('makeDeduction');
    if (gameState.collectedClues.length >= 8) {
        deductionBtn.disabled = false;
        document.querySelector('.deduction-hint').textContent = '你已经收集了足够的线索，可以开始推理了！';
    } else {
        deductionBtn.disabled = true;
        document.querySelector('.deduction-hint').textContent = `还需要收集更多线索 (${gameState.collectedClues.length}/8)`;
    }
}

// 开始对话
function startDialog(characterId) {
    const character = gameData.characters[characterId];
    if (!character) return;

    // 设置对话界面
    document.getElementById('dialogPortrait').src = character.portrait;
    document.getElementById('dialogCharacterName').textContent = character.name;
    document.getElementById('dialogCharacterRole').textContent = character.role;

    // 清空对话历史
    document.getElementById('conversationHistory').innerHTML = '';

    // 显示可用问题
    showAvailableQuestions(characterId);

    showScreen('dialogScreen');
}

// 显示可用问题（多选项对话）
function showAvailableQuestions(characterId) {
    const character = gameData.characters[characterId];
    const interactions = gameState.characterInteractions[characterId] || { questionsAsked: 0, askedQuestions: [], conversationPaths: {} };
    const questionList = document.getElementById('questionList');
    
    questionList.innerHTML = '';

    character.dialogues.forEach((dialogue) => {
        const pathKey = dialogue.id;
        const alreadyExplored = interactions.conversationPaths[pathKey];
        
        const button = document.createElement('button');
        button.className = `question-btn ${alreadyExplored ? 'explored' : ''}`;
        button.innerHTML = `
            <div class="option-label">${dialogue.option}</div>
            <div class="option-text">${dialogue.text}</div>
            ${alreadyExplored ? '<span class="explored-label">已探索</span>' : ''}
        `;
        
        button.addEventListener('click', () => {
            startConversationPath(characterId, dialogue);
        });
        
        questionList.appendChild(button);
    });
}

// 开始对话路径
function startConversationPath(characterId, dialogue) {
    if (!gameState.conversationDepth[characterId]) {
        gameState.conversationDepth[characterId] = {};
    }
    
    gameState.conversationDepth[characterId][dialogue.id] = 0;
    showDialogueStep(characterId, dialogue, 0);
}

// 显示对话步骤
function showDialogueStep(characterId, dialogue, stepIndex) {
    const conversationHistory = document.getElementById('conversationHistory');
    const step = dialogue.steps[stepIndex];
    
    if (!step) return;
    
    // 清空问题列表，显示对话选项
    const questionList = document.getElementById('questionList');
    questionList.innerHTML = '';
    
    // 添加玩家问题
    if (step.question) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'message question';
        questionDiv.innerHTML = `
            <div class="message-header">你问：</div>
            <div>${step.question}</div>
        `;
        conversationHistory.appendChild(questionDiv);
    }
    
    // 添加角色回答
    setTimeout(() => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'message answer';
        answerDiv.innerHTML = `
            <div class="message-header">${gameData.characters[characterId].name}：</div>
            <div>${step.answer}</div>
        `;
        conversationHistory.appendChild(answerDiv);
        
        // 如果有线索，添加线索
        if (step.clue) {
            setTimeout(() => {
                const clueDiv = document.createElement('div');
                clueDiv.className = 'message clue';
                clueDiv.innerHTML = `
                    <div class="message-header">🔍 获得线索：</div>
                    <div><strong>${step.clue.title}</strong><br>${step.clue.content}</div>
                `;
                conversationHistory.appendChild(clueDiv);
                
                // 添加线索到收集列表
                addClue(step.clue);
            }, 1000);
        }
        
        // 显示后续选项
        setTimeout(() => {
            if (step.followUps && step.followUps.length > 0) {
                showFollowUpOptions(characterId, dialogue, stepIndex);
            } else {
                // 对话结束，返回主问题列表
                markConversationCompleted(characterId, dialogue.id);
                showAvailableQuestions(characterId);
            }
        }, step.clue ? 2000 : 1500);
        
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    }, 500);
}

// 显示后续选项
function showFollowUpOptions(characterId, dialogue, currentStepIndex) {
    const questionList = document.getElementById('questionList');
    const currentStep = dialogue.steps[currentStepIndex];
    
    questionList.innerHTML = '<h4>选择你的回应：</h4>';
    
    currentStep.followUps.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'follow-up-btn';
        optionButton.innerHTML = `
            <div class="option-label">${String.fromCharCode(65 + index)}.</div>
            <div class="option-text">${option.text}</div>
        `;
        
        optionButton.addEventListener('click', () => {
            handleFollowUpChoice(characterId, dialogue, currentStepIndex, option);
        });
        
        questionList.appendChild(optionButton);
    });
}

// 处理后续选择
function handleFollowUpChoice(characterId, dialogue, currentStepIndex, choice) {
    const conversationHistory = document.getElementById('conversationHistory');
    
    // 添加玩家的选择
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'message choice';
    choiceDiv.innerHTML = `
        <div class="message-header">你说：</div>
        <div>${choice.text}</div>
    `;
    conversationHistory.appendChild(choiceDiv);
    
    // 根据选择结果进行下一步
    setTimeout(() => {
        if (choice.nextStep !== undefined) {
            // 跳转到指定步骤
            showDialogueStep(characterId, dialogue, choice.nextStep);
        } else if (choice.response) {
            // 直接显示回应
            const responseDiv = document.createElement('div');
            responseDiv.className = 'message answer';
            responseDiv.innerHTML = `
                <div class="message-header">${gameData.characters[characterId].name}：</div>
                <div>${choice.response}</div>
            `;
            conversationHistory.appendChild(responseDiv);
            
            // 如果有线索，添加线索
            if (choice.clue) {
                setTimeout(() => {
                    const clueDiv = document.createElement('div');
                    clueDiv.className = 'message clue';
                    clueDiv.innerHTML = `
                        <div class="message-header">🔍 获得线索：</div>
                        <div><strong>${choice.clue.title}</strong><br>${choice.clue.content}</div>
                    `;
                    conversationHistory.appendChild(clueDiv);
                    addClue(choice.clue);
                }, 1000);
            }
            
            // 对话结束
            setTimeout(() => {
                markConversationCompleted(characterId, dialogue.id);
                showAvailableQuestions(characterId);
            }, choice.clue ? 2500 : 1500);
        }
        
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    }, 500);
}

// 标记对话完成
function markConversationCompleted(characterId, dialogueId) {
    if (!gameState.characterInteractions[characterId]) {
        gameState.characterInteractions[characterId] = { questionsAsked: 0, askedQuestions: [], conversationPaths: {} };
    }
    
    gameState.characterInteractions[characterId].conversationPaths[dialogueId] = true;
    gameState.characterInteractions[characterId].questionsAsked++;
    gameState.questionsAsked++;
}

// 询问问题 (废弃的旧系统，已被多选项对话替代)
// 该函数保留以防兼容性问题，但新系统使用 startConversationPath

// 添加线索
function addClue(clue) {
    // 检查是否已经有相同线索
    const existingClue = gameState.collectedClues.find(c => c.title === clue.title);
    if (!existingClue) {
        gameState.collectedClues.push(clue);
    }
}

// 显示搜证界面
function showSearchScreen() {
    showScreen('searchScreen');
    updateLocationCards();
}

// 更新地点卡片状态
function updateLocationCards() {
    document.querySelectorAll('.location-card').forEach(card => {
        const locationId = card.dataset.location;
        const searchedCount = gameState.searchedLocations.filter(loc => loc === locationId).length;
        const totalEvidence = locationData[locationId] ? locationData[locationId].evidence.length : 0;
        
        if (searchedCount >= totalEvidence) {
            card.classList.add('fully-searched');
        }
    });
}

// 搜索地点
function searchLocation(locationId) {
    const location = locationData[locationId];
    if (!location) return;

    gameState.currentLocation = locationId;
    
    // 设置地点详情
    document.getElementById('locationIcon').textContent = location.icon;
    document.getElementById('locationName').textContent = location.name;
    document.getElementById('locationDescription').textContent = location.description;
    
    // 显示场景图片和热点
    showSceneImage(locationId);
    
    showScreen('locationDetailScreen');
}

// 显示场景图片和热点
function showSceneImage(locationId) {
    const location = locationData[locationId];
    const sceneImg = document.getElementById('sceneImg');
    const hotspotsContainer = document.getElementById('evidenceHotspots');
    
    // 设置场景图片
    sceneImg.src = `assets/${locationId}-scene.svg`;
    sceneImg.alt = location.name;
    
    // 清空之前的热点
    hotspotsContainer.innerHTML = '';
    
    // 创建证据热点
    location.evidence.forEach((evidence, index) => {
        const evidenceId = `${locationId}_${index}`;
        const alreadyFound = gameState.evidenceFound.includes(evidenceId);
        
        const hotspot = document.createElement('div');
        hotspot.className = `evidence-hotspot ${alreadyFound ? 'found' : ''}`;
        hotspot.innerHTML = alreadyFound ? '✓' : '?';
        hotspot.title = evidence.hint;
        
        // 设置热点位置 (基于证据索引的预定位置)
        const positions = getEvidencePositions(locationId);
        if (positions[index]) {
            hotspot.style.left = positions[index].x + '%';
            hotspot.style.top = positions[index].y + '%';
            hotspot.style.width = '40px';
            hotspot.style.height = '40px';
        }
        
        if (!alreadyFound) {
            hotspot.addEventListener('click', () => {
                findEvidence(locationId, index, evidence);
            });
        }
        
        hotspotsContainer.appendChild(hotspot);
    });
}

// 获取每个场景证据点的位置
function getEvidencePositions(locationId) {
    const positions = {
        library: [
            { x: 43, y: 57 },  // 古希腊雕像
            { x: 53, y: 73 },  // 擕毁的文件
            { x: 15, y: 58 },  // 保险箱
            { x: 58, y: 60 }   // 信件
        ],
        bedroom: [
            { x: 72, y: 55 },  // 药物盒
            { x: 24, y: 58 },  // 私人日记
            { x: 83, y: 33 }   // 家族照片
        ],
        kitchen: [
            { x: 70, y: 35 },  // 厨具收纳区
            { x: 15, y: 42 }   // 工作日程表
        ],
        greenhouse: [
            { x: 25, y: 87 },  // 脚印
            { x: 60, y: 87 }   // 丢弃的手帕
        ],
        garage: [
            { x: 60, y: 48 }   // 油渍手套
        ],
        garden: [
            { x: 25, y: 58 },  // 踩踏的花坛
            { x: 68, y: 80 }   // 掩埋的物品
        ]
    };
    
    return positions[locationId] || [];
}

// 显示证据点
function showEvidencePoints(locationId) {
    const location = locationData[locationId];
    const evidencePointsContainer = document.getElementById('evidencePoints');
    
    evidencePointsContainer.innerHTML = '';
    
    location.evidence.forEach((evidence, index) => {
        const alreadyFound = gameState.evidenceFound.includes(`${locationId}_${index}`);
        
        const evidencePoint = document.createElement('div');
        evidencePoint.className = `evidence-point ${alreadyFound ? 'found' : ''}`;
        evidencePoint.innerHTML = `
            <div class="evidence-icon">${evidence.icon}</div>
            <div class="evidence-info">
                <h4>${evidence.name}</h4>
                <p>${evidence.hint}</p>
                ${alreadyFound ? '<span class="found-label">已搜索</span>' : ''}
            </div>
        `;
        
        if (!alreadyFound) {
            evidencePoint.addEventListener('click', () => {
                findEvidence(locationId, index, evidence);
            });
        }
        
        evidencePointsContainer.appendChild(evidencePoint);
    });
}

// 发现证据
function findEvidence(locationId, evidenceIndex, evidence) {
    const evidenceId = `${locationId}_${evidenceIndex}`;
    
    if (gameState.evidenceFound.includes(evidenceId)) {
        return; // 已经找到过
    }
    
    gameState.evidenceFound.push(evidenceId);
    gameState.searchedLocations.push(locationId);
    
    // 添加到线索列表
    if (evidence.clue) {
        addClue(evidence.clue);
    }
    
    // 显示发现动画
    showEvidenceFoundNotification(evidence);
    
    // 更新UI
    showSceneImage(locationId); // 更新场景图片热点
    updateLocationCards();
    updateUI();
}

// 显示证据发现通知
function showEvidenceFoundNotification(evidence) {
    const notification = document.createElement('div');
    notification.className = 'evidence-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">🔍</div>
            <div class="notification-text">
                <h4>发现证据！</h4>
                <p>${evidence.name}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 显示线索屏幕
function showClueScreen() {
    const clueList = document.getElementById('clueList');
    clueList.innerHTML = '';

    if (gameState.collectedClues.length === 0) {
        clueList.innerHTML = '<p style="text-align: center; color: #a0a0a0;">还没有收集到任何线索</p>';
    } else {
        // 按类别分组显示线索
        const clueCategories = categorizeClues(gameState.collectedClues);
        
        Object.keys(clueCategories).forEach(category => {
            if (clueCategories[category].length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'clue-category';
                
                const categoryHeader = document.createElement('h3');
                categoryHeader.className = 'category-header';
                categoryHeader.textContent = getCategoryTitle(category);
                categoryDiv.appendChild(categoryHeader);
                
                clueCategories[category].forEach(clue => {
                    const clueDiv = document.createElement('div');
                    clueDiv.className = `clue-item ${clue.type === 'misleading' ? 'misleading-clue' : ''}`;
                    clueDiv.innerHTML = `
                        <div class="clue-title">${clue.title}</div>
                        <div class="clue-source">来源：${clue.source}</div>
                        <div class="clue-content">${clue.content}</div>
                        ${clue.type === 'misleading' ? '<div class="misleading-label">⚙️ 可能是迷惑性线索</div>' : ''}
                    `;
                    categoryDiv.appendChild(clueDiv);
                });
                
                clueList.appendChild(categoryDiv);
            }
        });
        
        // 添加线索分析统计
        const analysisDiv = document.createElement('div');
        analysisDiv.className = 'clue-analysis';
        analysisDiv.innerHTML = generateClueAnalysis(gameState.collectedClues);
        clueList.appendChild(analysisDiv);
    }

    showScreen('clueScreen');
}

// 线索分类
function categorizeClues(clues) {
    const categories = {
        evidence: [], // 物理证据
        testimony: [], // 证言信息  
        behavior: [], // 行为分析
        motive: [], // 动机线索
        timeline: [], // 时间线
        other: [] // 其他
    };
    
    clues.forEach(clue => {
        if (clue.title.includes('证据') || clue.title.includes('凶器') || clue.title.includes('现场') || clue.title.includes('指纹')) {
            categories.evidence.push(clue);
        } else if (clue.title.includes('行踪') || clue.title.includes('行为') || clue.title.includes('观察')) {
            categories.behavior.push(clue);
        } else if (clue.title.includes('动机') || clue.title.includes('遗产') || clue.title.includes('经济') || clue.title.includes('矛盾') || clue.title.includes('冲突')) {
            categories.motive.push(clue);
        } else if (clue.title.includes('时间') || clue.title.includes('日程')) {
            categories.timeline.push(clue);
        } else if (clue.source.includes('对话')) {
            categories.testimony.push(clue);
        } else {
            categories.other.push(clue);
        }
    });
    
    return categories;
}

// 获取分类标题
function getCategoryTitle(category) {
    const titles = {
        evidence: '🔍 物理证据',
        testimony: '💬 证言信息',
        behavior: '👁️ 行为分析',
        motive: '🎯 动机线索',
        timeline: '⏰ 时间线',
        other: '📝 其他信息'
    };
    return titles[category] || '📝 其他信息';
}

// 生成线索分析
function generateClueAnalysis(clues) {
    const totalClues = clues.length;
    const misleadingClues = clues.filter(clue => clue.type === 'misleading').length;
    const validClues = totalClues - misleadingClues;
    
    // 统计每个角色的线索数量
    const characterClues = {};
    clues.forEach(clue => {
        if (clue.source && clue.source.includes('与') && clue.source.includes('的对话')) {
            const match = clue.source.match(/与(.+?)的对话/);
            if (match) {
                const character = match[1];
                characterClues[character] = (characterClues[character] || 0) + 1;
            }
        }
    });
    
    let analysis = `
        <div class="analysis-header">
            <h3>📊 线索分析统计</h3>
        </div>
        <div class="analysis-stats">
            <div class="stat-item">
                <span class="stat-label">总线索数：</span>
                <span class="stat-value">${totalClues}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">有效线索：</span>
                <span class="stat-value valid">${validClues}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">迷惑线索：</span>
                <span class="stat-value misleading">${misleadingClues}</span>
            </div>
        </div>
    `;
    
    if (Object.keys(characterClues).length > 0) {
        analysis += '<div class="character-clue-stats">';
        analysis += '<h4>👥 角色线索分布：</h4>';
        Object.keys(characterClues).forEach(character => {
            analysis += `
                <div class="character-stat">
                    <span class="character-name">${character}：</span>
                    <span class="clue-count">${characterClues[character]} 条</span>
                </div>
            `;
        });
        analysis += '</div>';
    }
    
    // 添加推理建议
    if (validClues >= 8) {
        analysis += `
            <div class="analysis-suggestion success">
                🎉 您已经收集了足够的有效线索，可以开始进行推理了！
            </div>
        `;
    } else {
        analysis += `
            <div class="analysis-suggestion warning">
                🔍 建议继续收集线索，需要至少 8 条有效线索才能进行可靠的推理。
            </div>
        `;
    }
    
    return analysis;
}

// 显示推理屏幕
function showDeductionScreen() {
    showScreen('deductionScreen');
}

// 提交推理
function submitDeduction() {
    const suspect = gameState.selectedSuspect;
    
    if (!suspect) {
        alert('请先选择一个嫌疑人！');
        return;
    }
    
    // 检查答案
    const isCorrect = suspect === 'bates'; // 管家是真凶
    
    showResult(isCorrect, suspect);
}

// 显示结果
function showResult(isCorrect, selectedSuspect) {
    const resultContent = document.getElementById('resultContent');
    const character = gameData.characters[selectedSuspect];
    
    if (isCorrect) {
        resultContent.innerHTML = `
            <h2 class="correct">🎉 推理正确！</h2>
            <div class="character-portrait">
                <img src="${character.portrait}" alt="${character.name}" style="width: 150px; height: 150px; border-radius: 50%; margin: 1rem 0;">
            </div>
            <p><strong>真正的凶手：${character.name}</strong></p>
            <div class="truth-reveal">
                <h3>真相揭露：</h3>
                <p>阿尔弗雷德·贝茨，这位忠心服务了30年的老管家，终于在道德和忠诚之间选择了前者。</p>
                <p>当他发现雷金纳德的古董欺诈行为时，内心的痛苦与日俱增。他多次勇告主人停止这些勾当，但雷金纳德却说"已经太迟了"。</p>
                <p>那个雪夜，当贝茨再次被要求协助伪造文件时，他的忠诚终于达到了极限。在短暂的冲动下，他用书房里的一件收藏品结束了这一切。</p>
                <p>此后，他精心安排了现场，利用自己对庄园的熟悉和主人作息的了解，制造了一个看似完美的不在场证明。</p>
                <p>贝茨的动机不是贪婪，也不是仇恨，而是一种扭曲的正义感和对过去美好时光的维护。</p>
            </div>
        `;
    } else {
        resultContent.innerHTML = `
            <h2 class="incorrect">❌ 推理错误！</h2>
            <div class="character-portrait">
                <img src="${character.portrait}" alt="${character.name}" style="width: 150px; height: 150px; border-radius: 50%; margin: 1rem 0;">
            </div>
            <p>你指认的嫌疑人：<strong>${character.name}</strong></p>
            <p>很遗憾，你的推理有误。真正的凶手是管家阿尔弗雷德·贝茨。</p>
            <div class="hint">
                <h3>提示：</h3>
                <p>再次检查线索，注意各个角色的动机、机会和不在场证明。记住，真正的凶手往往就在你身边！</p>
            </div>
        `;
    }
    
    gameState.gameCompleted = true;
    gameState.gameCompleted = true;
    showScreen('resultScreen');
}

// 重新开始游戏
function restartGame() {
    gameState = {
        currentScreen: 'title',
        collectedClues: [],
        characterInteractions: {},
        searchedLocations: [],
        questionsAsked: 0,
        totalQuestions: 30,
        selectedSuspect: null,
        gameCompleted: false,
        currentLocation: null,
        evidenceFound: [],
        conversationDepth: {}
    };
    
    // 重置UI
    const reasoningTextElement = document.getElementById('reasoningText');
    if (reasoningTextElement) {
        reasoningTextElement.value = '';
    }
    
    document.querySelectorAll('.suspect-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('completed');
    });
    document.querySelectorAll('.location-card').forEach(card => {
        card.classList.remove('fully-searched');
    });
    
    showScreen('titleScreen');
    updateUI();
}

// 加载角色对话数据
function loadCharacterData() {
    // 数据已在 gameData.js 中定义
    // 这里可以做一些初始化工作
    console.log('角色数据加载完成');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 内容加载完成，开始初始化游戏...');
    initGame();
    updateUI();
    console.log('游戏初始化完成');
});

// 窗口加载完成后的备用初始化（确保所有资源都加载完成）
window.addEventListener('load', () => {
    console.log('窗口加载完成，检查游戏状态...');
    // 确保开始游戏按钮事件已绑定
    const startBtn = document.getElementById('startGame');
    if (startBtn) {
        console.log('找到开始游戏按钮');
        // 移除可能存在的旧事件监听器，重新绑定
        const newStartBtn = startBtn.cloneNode(true);
        startBtn.parentNode.replaceChild(newStartBtn, startBtn);
        
        newStartBtn.addEventListener('click', (e) => {
            console.log('开始游戏按钮被点击');
            e.preventDefault();
            showScreen('gameScreen');
            updateUI();
        });
    } else {
        console.error('未找到开始游戏按钮 (ID: startGame)');
    }
});