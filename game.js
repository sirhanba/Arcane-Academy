// --- ESTADO DO JOGO ---
var STORAGE_KEY = "arcanum_save";

var defaultSave = {
    name: "",
    gender: "M",
    avatarIndex: 0,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    gold: 20,
    weapon: WEAPONS[0],
    armor: ARMORS[0],
    inventory: []
};

var gameState = loadGame();

function loadGame() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return JSON.parse(JSON.stringify(defaultSave));
        }
    }
    return JSON.parse(JSON.stringify(defaultSave));
}

function saveGame() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function resetGame() {
    localStorage.removeItem(STORAGE_KEY);
    gameState = JSON.parse(JSON.stringify(defaultSave));
    render();
}

// --- CONTROLES DA CRIAÇÃO DE PERSONAGEM ---
var tempName = "";
var tempGender = "F";
var tempAvatar = 1;

function selectGender(g) {
    tempGender = g;
    render();
}

function changeAvatar(dir) {
    tempAvatar += dir;
    if (tempAvatar < 1) tempAvatar = 3;
    if (tempAvatar > 3) tempAvatar = 1;
    render();
}

function confirmCharacter() {
    var input = document.getElementById("nickInput");
    var val = input ? input.value.trim() : tempName;
    if (!val) {
        alert("Por favor, digite um nome!");
        return;
    }
    gameState.name = val;
    gameState.gender = tempGender;
    gameState.avatarIndex = tempAvatar;
    saveGame();
    render();
}

// --- RENDERIZAÇÃO DA TELA ---
function render() {
    var app = document.getElementById("app");
    if (!app) return;

    // Se o personagem ainda não foi criado
    if (!gameState.name) {
        app.innerHTML = `
            <div style="padding: 20px; text-align: center; color: white; font-family: sans-serif;">
                <h3>Crie seu personagem</h3>
                
                <div style="margin-bottom: 15px;">
                    <input id="nickInput" type="text" value="${tempName}" placeholder="Digite seu nome" 
                           oninput="tempName = this.value"
                           style="padding: 10px; border-radius: 8px; border: 1px solid #555; background: #222; color: #fff; width: 70%;">
                </div>

                <div style="margin-bottom: 15px;">
                    <button onclick="selectGender('F')" style="padding: 10px; margin-right: 5px; border-radius: 8px; background: ${tempGender === 'F' ? '#6b21a8' : '#333'}; color: white; border: none;">♀ Feminino</button>
                    <button onclick="selectGender('M')" style="padding: 10px; border-radius: 8px; background: ${tempGender === 'M' ? '#6b21a8' : '#333'}; color: white; border: none;">♂ Masculino</button>
                </div>

                <div style="margin-bottom: 20px;">
                    <button onclick="changeAvatar(-1)" style="padding: 8px 15px; border-radius: 8px; background: #333; color: white; border: none;">❮</button>
                    <span style="margin: 0 15px;">Visual ${tempAvatar}</span>
                    <button onclick="changeAvatar(1)" style="padding: 8px 15px; border-radius: 8px; background: #333; color: white; border: none;">❯</button>
                </div>

                <button onclick="confirmCharacter()" style="padding: 12px 30px; border-radius: 8px; background: #8b5cf6; color: white; font-weight: bold; border: none; width: 80%;">Confirmar</button>
                
                <br><br>
                <a href="#" onclick="resetGame(); return false;" style="color: #ef4444; font-size: 12px;">Resetar progresso (teste)</a>
            </div>
        `;
        return;
    }

    // Tela Principal do Jogo após criar o personagem
    app.innerHTML = `
        <div style="padding: 20px; color: white; font-family: sans-serif;">
            <h2>Olá, ${gameState.name}!</h2>
            <p><strong>Arma:</strong> ${gameState.weapon.name}</p>
            <p><strong>Armadura:</strong> ${gameState.armor.name}</p>
            <p><strong>Ouro:</strong> ${gameState.gold} 🪙</p>
            <hr style="border-color: #444;">
            <p style="color: #4ade80;">Jogo carregado e funcionando perfeitamente!</p>
            <br>
            <button onclick="resetGame()" style="padding: 8px 15px; border-radius: 8px; background: #ef4444; color: white; border: none;">Resetar Personagem</button>
        </div>
    `;
}

// Inicializa a interface quando a página carrega
window.onload = function() {
    render();
};
