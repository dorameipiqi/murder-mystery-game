// 游戏状态
let gameState = {
    currentScreen: 'title',
    collectedClues: [],
    characterInteractions: {},
    questionsAsked: 0,
    totalQuestions: 30,
    selectedSuspect: null,
    gameCompleted: false
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

    // 推理文本输入
    document.getElementById('reasoningText').addEventListener('input', () => {
        checkDeductionReady();
    });

    // 加载角色对话数据
    loadCharacterData();
}

// 检查推理是否准备就绪
function checkDeductionReady() {
    const suspect = gameState.selectedSuspect;
    const reasoning = document.getElementById('reasoningText').value.trim();
    const submitBtn = document.getElementById('submitDeduction');
    
    if (suspect && reasoning.length > 10) {
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
        if (interactions.questionsAsked >= 5) {
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

// 显示可用问题
function showAvailableQuestions(characterId) {
    const character = gameData.characters[characterId];
    const interactions = gameState.characterInteractions[characterId] || { questionsAsked: 0, askedQuestions: [] };
    const questionList = document.getElementById('questionList');
    
    questionList.innerHTML = '';

    character.questions.forEach((question, index) => {
        const isAsked = interactions.askedQuestions.includes(question.id);
        const button = document.createElement('button');
        button.className = 'question-btn';
        button.textContent = question.text;
        button.disabled = isAsked;
        
        if (!isAsked) {
            button.addEventListener('click', () => {
                askQuestion(characterId, question);
            });
        }
        
        questionList.appendChild(button);
    });
}

// 询问问题
function askQuestion(characterId, question) {
    const conversationHistory = document.getElementById('conversationHistory');
    
    // 添加问题到对话历史
    const questionDiv = document.createElement('div');
    questionDiv.className = 'message question';
    questionDiv.innerHTML = `
        <div class="message-header">你问：</div>
        <div>${question.text}</div>
    `;
    conversationHistory.appendChild(questionDiv);

    // 添加回答到对话历史
    setTimeout(() => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'message answer';
        answerDiv.innerHTML = `
            <div class="message-header">${gameData.characters[characterId].name}：</div>
            <div>${question.answer}</div>
        `;
        conversationHistory.appendChild(answerDiv);

        // 如果有线索，添加线索
        if (question.clue) {
            setTimeout(() => {
                const clueDiv = document.createElement('div');
                clueDiv.className = 'message clue';
                clueDiv.innerHTML = `
                    <div class="message-header">🔍 获得线索：</div>
                    <div><strong>${question.clue.title}</strong><br>${question.clue.content}</div>
                `;
                conversationHistory.appendChild(clueDiv);
                
                // 添加线索到收集列表
                addClue(question.clue);
            }, 1000);
        }

        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    }, 500);

    // 更新交互状态
    if (!gameState.characterInteractions[characterId]) {
        gameState.characterInteractions[characterId] = { questionsAsked: 0, askedQuestions: [] };
    }
    
    gameState.characterInteractions[characterId].askedQuestions.push(question.id);
    gameState.characterInteractions[characterId].questionsAsked++;
    gameState.questionsAsked++;

    // 刷新问题列表
    showAvailableQuestions(characterId);
}

// 添加线索
function addClue(clue) {
    // 检查是否已经有相同线索
    const existingClue = gameState.collectedClues.find(c => c.title === clue.title);
    if (!existingClue) {
        gameState.collectedClues.push(clue);
    }
}

// 显示线索屏幕
function showClueScreen() {
    const clueList = document.getElementById('clueList');
    clueList.innerHTML = '';

    if (gameState.collectedClues.length === 0) {
        clueList.innerHTML = '<p style="text-align: center; color: #a0a0a0;">还没有收集到任何线索</p>';
    } else {
        gameState.collectedClues.forEach(clue => {
            const clueDiv = document.createElement('div');
            clueDiv.className = 'clue-item';
            clueDiv.innerHTML = `
                <div class="clue-title">${clue.title}</div>
                <div class="clue-source">来源：${clue.source}</div>
                <div class="clue-content">${clue.content}</div>
            `;
            clueList.appendChild(clueDiv);
        });
    }

    showScreen('clueScreen');
}

// 显示推理屏幕
function showDeductionScreen() {
    showScreen('deductionScreen');
}

// 提交推理
function submitDeduction() {
    const suspect = gameState.selectedSuspect;
    const reasoning = document.getElementById('reasoningText').value.trim();
    
    // 检查答案
    const isCorrect = suspect === 'bates'; // 管家是真凶
    
    showResult(isCorrect, suspect, reasoning);
}

// 显示结果
function showResult(isCorrect, selectedSuspect, reasoning) {
    const resultContent = document.getElementById('resultContent');
    const character = gameData.characters[selectedSuspect];
    
    if (isCorrect) {
        resultContent.innerHTML = `
            <h2 class="correct">🎉 推理正确！</h2>
            <p>你成功找出了真正的凶手：<strong>${character.name}</strong></p>
            <div style="text-align: left; margin: 2rem 0; padding: 1.5rem; background: rgba(72, 187, 120, 0.1); border-radius: 10px; border-left: 4px solid #48bb78;">
                <h3>案件真相：</h3>
                <p>阿尔弗雷德·贝茨，这位忠诚服务了30年的管家，因为无法承受良心谴责而杀死了自己的主人。</p>
                <p><strong>动机：</strong>贝茨发现并被迫参与了雷文斯伍德的古董欺诈活动，内心深受煎熬。当晚雷文斯伍德要求他参与更大规模的欺诈时，道德冲突终于爆发。</p>
                <p><strong>手法：</strong>利用自己的备用钥匙进入书房，在争吵中情绪失控，用青铜雕像击打雷文斯伍德致死。</p>
                <p><strong>关键证据：</strong>只有贝茨有备用钥匙，指纹在凶器上，时间线上有空白，以及他表现出的内心挣扎。</p>
            </div>
            <div style="text-align: left; padding: 1.5rem; background: rgba(66, 153, 225, 0.1); border-radius: 10px; border-left: 4px solid #4299e1;">
                <h3>你的推理：</h3>
                <p>${reasoning}</p>
            </div>
            <p style="margin-top: 2rem;">这正是阿加莎·克里斯蒂作品的精髓——真凶往往是最不起眼但又最关键的人物。</p>
        `;
    } else {
        resultContent.innerHTML = `
            <h2 class="incorrect">❌ 推理错误</h2>
            <p>你选择的嫌疑人是：<strong>${character.name}</strong></p>
            <div style="text-align: left; margin: 2rem 0; padding: 1.5rem; background: rgba(229, 62, 62, 0.1); border-radius: 10px; border-left: 4px solid #e53e3e;">
                <h3>正确答案：</h3>
                <p>真正的凶手是<strong>阿尔弗雷德·贝茨（管家）</strong></p>
                <p>他因为道德冲突和良心谴责，在30年忠诚服务后杀死了自己的主人。关键证据包括独有的钥匙权限、凶器上的指纹、以及案发时间的行踪空白。</p>
            </div>
            <div style="text-align: left; padding: 1.5rem; background: rgba(66, 153, 225, 0.1); border-radius: 10px; border-left: 4px solid #4299e1;">
                <h3>你的推理：</h3>
                <p>${reasoning}</p>
            </div>
            <p style="margin-top: 2rem;">不过没关系，推理需要练习。试着重新审视线索，特别关注那些看似最忠诚的人...</p>
        `;
    }
    
    gameState.gameCompleted = true;
    showScreen('resultScreen');
}

// 重新开始游戏
function restartGame() {
    gameState = {
        currentScreen: 'title',
        collectedClues: [],
        characterInteractions: {},
        questionsAsked: 0,
        totalQuestions: 30,
        selectedSuspect: null,
        gameCompleted: false
    };
    
    // 重置UI
    document.getElementById('reasoningText').value = '';
    document.querySelectorAll('.suspect-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('completed');
    });
    
    showScreen('titleScreen');
    updateUI();
}

// 加载角色对话数据
function loadCharacterData() {
    // 这里可以从外部文件加载数据，现在先用内置数据
    window.gameData = {
        characters: {
            emily: {
                name: "艾米莉亚·雷文斯伍德",
                role: "侄女，25岁",
                portrait: "assets/emily.svg",
                questions: [
                    {
                        id: "emily_q1",
                        text: "你对叔叔的死有什么看法？",
                        answer: "这太可怕了...叔叔虽然严厉，但他一直很疼爱我。我不敢相信有人会伤害他。",
                        clue: null
                    },
                    {
                        id: "emily_q2",
                        text: "案发时你在哪里？",
                        answer: "我...我在自己的房间里整理东西。头有点疼，所以早早离开了餐厅。",
                        clue: {
                            title: "艾米莉亚的行踪疑点",
                            content: "艾米莉亚声称在房间里，但表情闪躲，似乎在隐瞒什么。",
                            source: "与艾米莉亚的对话"
                        }
                    },
                    {
                        id: "emily_q3",
                        text: "你知道叔叔最近有什么烦心事吗？",
                        answer: "叔叔最近确实有些焦虑，经常在书房里待到很晚。我觉得是生意上的事情让他压力很大。",
                        clue: {
                            title: "雷文斯伍德的压力",
                            content: "据艾米莉亚观察，死者最近压力很大，经常熬夜处理事务。",
                            source: "与艾米莉亚的对话"
                        }
                    },
                    {
                        id: "emily_q4",
                        text: "你与叔叔最近有什么冲突吗？",
                        answer: "我只是希望能有更多的自由。叔叔总是觉得我还是个孩子，但我已经25岁了。",
                        clue: {
                            title: "叔侄间的矛盾",
                            content: "艾米莉亚渴望自由，与叔叔在人生选择上有分歧。",
                            source: "与艾米莉亚的对话"
                        }
                    },
                    {
                        id: "emily_q5",
                        text: "如果叔叔去世，你会继承什么？",
                        answer: "我从来没有想过这个问题...我真的不关心遗产的事情。",
                        clue: {
                            title: "遗产继承",
                            content: "艾米莉亚是雷文斯伍德的主要继承人。",
                            source: "与艾米莉亚的对话"
                        }
                    }
                ]
            },
            morrison: {
                name: "詹姆斯·莫里森",
                role: "商业伙伴，45岁",
                portrait: "assets/morrison.svg",
                questions: [
                    {
                        id: "morrison_q1",
                        text: "你今天下午与雷文斯伍德发生了争吵？",
                        answer: "是的，我承认我很愤怒。但那只是生意上的分歧！雷金纳德在某些交易上不够诚实。",
                        clue: {
                            title: "商业争执",
                            content: "莫里森承认与死者发生激烈争吵，涉及商业诚信问题。",
                            source: "与莫里森的对话"
                        }
                    },
                    {
                        id: "morrison_q2",
                        text: "你威胁过要让他'付出代价'吗？",
                        answer: "我是说了气话，但那只是指法律途径！我要揭露他的欺诈行为。",
                        clue: {
                            title: "威胁言论",
                            content: "莫里森承认说过威胁的话，但声称指的是法律手段。",
                            source: "与莫里森的对话"
                        }
                    },
                    {
                        id: "morrison_q3",
                        text: "案发时间你在做什么？",
                        answer: "我在吸烟室抽雪茄，试图冷静下来。那场争吵让我很烦躁。",
                        clue: null
                    },
                    {
                        id: "morrison_q4",
                        text: "你了解雷文斯伍德的其他犯罪行为吗？",
                        answer: "我怀疑他伪造了很多古董认证，欺骗了无数收藏家。",
                        clue: {
                            title: "古董欺诈网络",
                            content: "莫里森怀疑死者涉嫌大规模古董欺诈。",
                            source: "与莫里森的对话"
                        }
                    },
                    {
                        id: "morrison_q5",
                        text: "这次被骗对你影响大吗？",
                        answer: "说不大是假的...但我是个商人，我知道如何用正当手段解决问题。",
                        clue: {
                            title: "经济动机",
                            content: "这次被骗对莫里森的财务造成了重大影响。",
                            source: "与莫里森的对话"
                        }
                    }
                ]
            },
            harris: {
                name: "玛格丽特·哈里斯",
                role: "推理作家，38岁",
                portrait: "assets/harris.svg",
                questions: [
                    {
                        id: "harris_q1",
                        text: "作为推理作家，你对这个案子有什么看法？",
                        answer: "凶手显然对庄园很熟悉，知道雷文斯伍德的习惯。时机选择很巧妙。",
                        clue: {
                            title: "专业分析",
                            content: "哈里斯认为凶手熟悉庄园环境和死者习惯。",
                            source: "与哈里斯的对话"
                        }
                    },
                    {
                        id: "harris_q2",
                        text: "你今晚为什么来庄园？",
                        answer: "我对古董收藏很感兴趣，另外也在为新小说收集素材。",
                        clue: null
                    },
                    {
                        id: "harris_q3",
                        text: "你观察到其他人有什么可疑行为吗？",
                        answer: "管家贝茨先生看起来很紧张。艾米莉亚小姐也有些心神不宁。",
                        clue: {
                            title: "行为观察",
                            content: "哈里斯注意到管家贝茨异常紧张，艾米莉亚心神不宁。",
                            source: "与哈里斯的对话"
                        }
                    },
                    {
                        id: "harris_q4",
                        text: "你有没有发现什么重要线索？",
                        answer: "我在书房里注意到一些被撕毁的文件，保险箱是开着的，但贵重物品都还在。",
                        clue: {
                            title: "现场证据",
                            content: "书房中有被撕毁的认证书，保险箱被打开但贵重物品未失。",
                            source: "与哈里斯的对话"
                        }
                    },
                    {
                        id: "harris_q5",
                        text: "你觉得这起案件的动机是什么？",
                        answer: "从现场情况看，更像是某种道德冲突或者秘密被揭露的结果。",
                        clue: {
                            title: "动机推测",
                            content: "哈里斯认为案件动机可能是道德冲突或秘密曝光。",
                            source: "与哈里斯的对话"
                        }
                    }
                ]
            },
            bates: {
                name: "阿尔弗雷德·贝茨",
                role: "管家，60岁",
                portrait: "assets/bates.svg",
                questions: [
                    {
                        id: "bates_q1",
                        text: "你发现尸体时的情况能详细说说吗？",
                        answer: "我用备用钥匙开门时，看到主人倒在地上...那一刻我简直不敢相信。",
                        clue: {
                            title: "钥匙线索",
                            content: "只有贝茨和死者拥有书房钥匙，贝茨用备用钥匙发现了尸体。",
                            source: "与贝茨的对话"
                        }
                    },
                    {
                        id: "bates_q2",
                        text: "你对雷文斯伍德先生最近的行为有什么观察？",
                        answer: "主人最近确实有些不安。他经常熬夜工作，脾气也变得暴躁。",
                        clue: null
                    },
                    {
                        id: "bates_q3",
                        text: "案发时间，你在做什么？",
                        answer: "我在厨房安排晚餐后的清理工作，还要确保客房都准备妥当。",
                        clue: {
                            title: "贝茨的行踪",
                            content: "贝茨声称案发时在厨房工作，但需要验证。",
                            source: "与贝茨的对话"
                        }
                    },
                    {
                        id: "bates_q4",
                        text: "你知道主人的商业活动有什么不当之处吗？",
                        answer: "我只是个管家...有些事情最好不要知道太多。",
                        clue: {
                            title: "管家的隐瞒",
                            content: "贝茨明显在隐瞒关于主人商业活动的信息，表现出内心挣扎。",
                            source: "与贝茨的对话"
                        }
                    },
                    {
                        id: "bates_q5",
                        text: "30年的服务，你对这个家族有什么感情？",
                        answer: "这个家族就是我的一切...但有时候忠诚和良心会发生冲突。",
                        clue: {
                            title: "忠诚与良心的冲突",
                            content: "贝茨暗示忠诚与良心之间存在冲突。",
                            source: "与贝茨的对话"
                        }
                    }
                ]
            },
            sanders: {
                name: "威廉·桑德斯",
                role: "家庭医生，52岁",
                portrait: "assets/sanders.svg",
                questions: [
                    {
                        id: "sanders_q1",
                        text: "根据你的医学判断，死因是什么？",
                        answer: "从外伤来看，应该是钝器击打头部致死。凶器可能是那个青铜雕像。",
                        clue: {
                            title: "死因分析",
                            content: "医生确认死因是钝器击打头部，青铜雕像可能是凶器。",
                            source: "与桑德斯医生的对话"
                        }
                    },
                    {
                        id: "sanders_q2",
                        text: "雷文斯伍德的健康状况如何？",
                        answer: "雷金纳德确实有一些健康问题，主要是心脏方面的。",
                        clue: {
                            title: "健康隐患",
                            content: "死者患有心脏病，医生一直在治疗但保守秘密。",
                            source: "与桑德斯医生的对话"
                        }
                    },
                    {
                        id: "sanders_q3",
                        text: "你给他开的药物有副作用吗？",
                        answer: "虽然有些是实验性的新药，但剂量都在安全范围内。",
                        clue: {
                            title: "药物疑点",
                            content: "医生给死者开了实验性心脏病药物，可能存在医疗风险。",
                            source: "与桑德斯医生的对话"
                        }
                    },
                    {
                        id: "sanders_q4",
                        text: "雷文斯伍德最近的精神状态如何？",
                        answer: "他最近压力很大。他甚至问过我如果突然去世，家人会如何反应。",
                        clue: {
                            title: "死亡预感",
                            content: "死者最近向医生咨询过关于死亡的问题。",
                            source: "与桑德斯医生的对话"
                        }
                    },
                    {
                        id: "sanders_q5",
                        text: "案发时你在哪里？",
                        answer: "我在客厅与其他人聊天。当雷金纳德离开时，我想跟去检查，但他拒绝了。",
                        clue: {
                            title: "错失的救援机会",
                            content: "医生在死者离开时想要跟随检查，但被拒绝。",
                            source: "与桑德斯医生的对话"
                        }
                    }
                ]
            },
            victoria: {
                name: "维多利亚·斯特灵",
                role: "护士，28岁",
                portrait: "assets/victoria.svg",
                questions: [
                    {
                        id: "victoria_q1",
                        text: "你是什么时候开始为雷文斯伍德工作的？",
                        answer: "三个月前，我通过职业介绍所来到这里。",
                        clue: null
                    },
                    {
                        id: "victoria_q2",
                        text: "你对雷文斯伍德的健康状况了解多少？",
                        answer: "他确实有心脏问题，但我觉得桑德斯医生没有告诉我全部真相。",
                        clue: {
                            title: "医疗秘密",
                            content: "维多利亚怀疑医生隐瞒了病人的真实病情。",
                            source: "与维多利亚的对话"
                        }
                    },
                    {
                        id: "victoria_q3",
                        text: "你注意到雷文斯伍德最近有什么异常行为吗？",
                        answer: "他最近经常半夜起来，在书房里销毁文件。",
                        clue: {
                            title: "深夜活动",
                            content: "维多利亚目击死者深夜销毁文件，可能在掩盖某些秘密。",
                            source: "与维多利亚的对话"
                        }
                    },
                    {
                        id: "victoria_q4",
                        text: "案发时你在哪里？",
                        answer: "我在整理医疗用品。作为护士，我需要确保所有药物都妥善保管。",
                        clue: {
                            title: "维多利亚的行踪",
                            content: "维多利亚声称在整理医疗用品，表现有些紧张。",
                            source: "与维多利亚的对话"
                        }
                    },
                    {
                        id: "victoria_q5",
                        text: "你觉得这里有什么可疑的地方吗？",
                        answer: "这个庄园确实有很多秘密...我感觉不只是医疗方面的问题。",
                        clue: {
                            title: "庄园秘密",
                            content: "维多利亚暗示庄园中存在更多不为人知的秘密。",
                            source: "与维多利亚的对话"
                        }
                    }
                ]
            }
        }
    };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    updateUI();
});