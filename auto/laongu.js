// laongu.js - Extension version
(function () {
  'use strict';

  // Hàm chính
  const currentUrl = window.location.href;

  if (currentUrl.includes('m.sinodan.link/view')) {
      document.body.innerHTML = fixText(document.body.innerHTML);
  }

  // ... (giữ nguyên tất cả các hàm từ userscript: fixText, replaceName, insertStorage, convertPunctuation, processText, enTrans, countRepeatWords)
function fixText(str) {
    // Kiểm tra nếu URL chứa "m.sinodan.link"
    if (window.location.href.includes("m.sinodan.link")) {
        const emMappings = {
          n_1: '男', n_2: '人', n_3: '啊', n_4: '爱', n_5: '按',
          n_6: '暴', n_7: '臀', n_8: '逼', n_9: '擦', n_10: '潮',
          n_11: '操', n_12: '插', n_13: '吃', n_14: '抽', n_15: '处',
          n_16: '床', n_17: '春', n_18: '唇', n_19: '刺', n_20: '粗',
          n_21: '大', n_22: '洞', n_23: '逗', n_24: '硬', n_25: '儿',
          n_26: '反', n_27: '犯', n_28: '峰', n_29: '妇', n_30: '抚',
          n_31: '夫', n_32: '腹', n_33: '干', n_34: '搞', n_35: '根',
          n_36: '公', n_37: '宫', n_38: '勾', n_39: '股', n_40: '狠',
          n_41: '花', n_42: '滑', n_43: '坏', n_44: '魂', n_45: '鸡',
          n_46: '激', n_47: '夹', n_48: '奸', n_49: '交', n_50: '叫',
          n_51: '娇', n_52: '姐', n_53: '禁', n_54: '精', n_55: '进',
          n_56: '紧', n_57: '菊', n_58: '渴', n_59: '口', n_60: '裤',
          n_61: '胯', n_62: '快', n_63: '浪', n_64: '力', n_65: '接',
          n_66: '乱', n_67: '裸', n_68: '妈', n_69: '毛', n_70: '迷',
          n_71: '靡', n_72: '妹', n_73: '摸', n_74: '嫩', n_75: '母',
          n_76: '娘', n_77: '尿', n_78: '咛', n_79: '女', n_80: '哦',
          n_81: '趴', n_82: '喷', n_83: '婆', n_84: '屁', n_85: '气',
          n_86: '枪', n_87: '窃', n_88: '骑', n_89: '妻', n_90: '情',
          n_91: '亲', n_92: '裙', n_93: '热', n_94: '日', n_95: '肉',
          n_96: '揉', n_97: '乳', n_98: '软', n_99: '润', n_100: '入',
          n_101: '塞', n_102: '骚', n_103: '色', n_104: '上', n_105: '舌',
          n_106: '射', n_107: '身', n_108: '深', n_109: '湿', n_110: '兽',
          n_111: '受', n_112: '舒', n_113: '爽', n_114: '水', n_115: '睡',
          n_116: '酥', n_117: '死', n_118: '烫', n_119: '痛', n_120: '舔',
          n_121: '天', n_122: '体', n_123: '挺', n_124: '头', n_125: '腿',
          n_126: '脱', n_127: '味', n_128: '慰', n_129: '吻', n_130: '握',
          n_131: '喔', n_132: '污', n_133: '下', n_134: '小', n_135: '性',
          n_136: '胸', n_137: '血', n_138: '穴', n_139: '阳', n_140: '痒',
          n_141: '药', n_142: '腰', n_143: '夜', n_144: '液', n_145: '野',
          n_146: '衣', n_147: '姨', n_148: '吟', n_149: '淫', n_150: '荫',
          n_151: '幽', n_152: '诱', n_153: '尤', n_154: '欲', n_155: '吁',
          n_156: '玉', n_157: '吮', n_158: '窄', n_159: '占', n_160: '征',
          n_161: '汁', n_162: '嘴', n_163: ',', n_164: '.', n_165: '...',
          n_166: '慾', n_167: '丢', n_168: '弄'
        };

        Object.entries(emMappings).forEach(([emClass, chineseChar]) => {
            const emTag = `<em class="${emClass}"></em>`;
            str = str.replaceAll(emTag, chineseChar);
        });
    }

    // Các xử lý khác nếu cần thiết cho các trang web khác

    return str;
}

function replaceName(text) {
    if (namedatacache) {
      // Thực hiện thay thế từ cache nếu đã có
      namedatacache.forEach(([pattern, replacement]) => {
        text = text.replace(pattern, ` ${replacement} `);
      });
    } else {
      // Nếu chưa có cache, tạo cache và thực hiện thay thế
      namedatacache = [];

      namedata.split("\n").forEach(line => {
        const [pattern, replacement] = line.trim().split("=");
        if (pattern && replacement) {
          const regexPattern = new RegExp(pattern, "g");
          namedatacache.push([regexPattern, replacement]);
          text = text.replace(regexPattern, ` ${replacement} `);
        }
      });
    }

    return text;
}

function insertStorage(key, keyValueToUpdate) {
  const currentString = localStorage.getItem(key) || "";
  const keyValueArray = currentString.split('\n').map(entry => {
    const [key, value] = entry.split('=');
    // Kiểm tra nếu key không rỗng mới thêm vào mảng
    if (key !== undefined && key.trim() !== "") {
      return { key, value };
    }
  }).filter(Boolean); // Loại bỏ các giá trị undefined trong mảng

  const [keyToUpdate, newValue] = keyValueToUpdate.split('=');

  const existingEntryIndex = keyValueArray.findIndex(entry => entry.key === keyToUpdate);

  if (existingEntryIndex !== -1) {
    keyValueArray[existingEntryIndex].value = newValue;
    const [updatedEntry] = keyValueArray.splice(existingEntryIndex, 1);
    keyValueArray.unshift(updatedEntry);
  } else {
    keyValueArray.unshift({ key: keyToUpdate, value: newValue });
  }

  const resultString = keyValueArray.map(entry => `${entry.key}=${entry.value}`).join('\n');

  localStorage.setItem(key, resultString);
}

// Phương thức chuyển đổi dấu câu Trung Quốc sang chữ La-tinh
function convertPunctuation(text) {
    const mapping = {
        "。": ".", "，": ",", "、": ",", "；": ";", "！": "!", "？": "?",
        "：": ":", "（": "(", "）": ")", "〔": "[", "〕": "]", "【": "[",
        "】": "]", "｛": "{", "｝": "}", "『": "“", "』": "”", "～": "~",
        "〖": "[", "〗": "]", "〘": "[", "〙": "]", "〚": "[",
        "〛": "]", "　": " "
    };

    // Chuyển đổi từng ký tự trong văn bản dựa trên bảng ánh xạ
    return text.split('').map(char => mapping[char] || char).join('');
}

function processText(text) {
    const trimmedText = text
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .replace(/ +([,.?!\]\>:};)])/g, '$1 ')
        .replace(/ +([”’])/g, '$1')
        .replace(/([<\[(“‘{]) +/g, ' $1')
        .replace(/(^\s*|[“‘”’.!?\[-]\s*)(\p{Ll})/gmu, (_, p1, p2) => p1 + p2.toUpperCase())
        .replace(/ +/g, ' ');

    return trimmedText;
}

async function enTrans(text) {
    try {
        const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${text}`;
        const response = await fetch(apiUrl);
        const jsonData = await response.json();
        const translation = jsonData[0][0][0];
        return translation;
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

// Hàm đếm số lần xuất hiện của các từ trùng lặp trong một chuỗi văn bản
function countRepeatWords(text = 'hello', minWordLength = 2, maxWordLength = 10, minFrequency = 3, limit = 100) {
    // Loại bỏ khoảng trắng ở đầu và cuối chuỗi văn bản
    text = text.trim();

    // Biểu thức chính quy tách dấu câu, ký tự đặc biệt, dòng mới, tab và carriage return
    //const regex = /[\p{P}\n\t\r]/ug;
    const regex = /[\p{P}\n\t\r的了著]/ug;
    const wordsArray = text.split(regex).map((item) => item.trim()).filter(Boolean);

    // Tìm các từ duy nhất có độ dài từ minWordLength đến maxWordLength
    let uniqueWords = new Set();
    for (let i = 0; i < wordsArray.length; i++) {
        for (let j = 0; j < wordsArray[i].length; j++) {
            for (let k = minWordLength; k <= maxWordLength; k++) {
                if (j + k > wordsArray[i].length) continue;
                let word = wordsArray[i].slice(j, j + k).trim();
                if (word.length >= minWordLength) uniqueWords.add(word);
            }
        }
    }

    // Tạo một mảng từ tập hợp các từ duy nhất
    let uniqueWordsArray = Array.from(uniqueWords);

    // Đếm tần suất xuất hiện của từng từ trong chuỗi văn bản
    let result = [];
    for (let i = 0; i < uniqueWordsArray.length; i++) {
        let frequency = text.split(uniqueWordsArray[i]).length - 1;
        if (frequency > minFrequency) {
            result.push({ 'word': uniqueWordsArray[i], 'freq': frequency });
        }
    }

    // Sắp xếp kết quả theo tần suất xuất hiện giảm dần và độ dài từ giảm dần
    result.sort((a, b) => { 
        return b.freq - a.freq || b.word.length - a.word.length;
    });

    //return result;
    // Giới hạn kết quả chỉ lấy limit phần tử đầu tiên
    return result.slice(0, limit);
}


  // Hàm khởi tạo dịch trang
  async function initializeTranslation() {
    try {
      console.log('🔄 Bắt đầu khởi tạo dịch trang...');
      
      const documentClone = document.cloneNode(true);
      const article = new Readability(documentClone).parse();

      let originalTextContent = '';

      if (article && article.title) {
        originalTextContent = article.title + '\n\n' + html2text(article.content);
      } else if (article) {
        originalTextContent = html2text(article.content);
      } else {
        originalTextContent = document.body.innerText;
      }

      window.originalTextContent = originalTextContent;
      
      // Tạo nút dịch trên trang
      createTranslateButton();
      
      console.log('✅ Đã khởi tạo dịch trang thành công');
      
    } catch (error) {
      console.error('❌ Lỗi khởi tạo dịch trang:', error);
    }
  }

  // Hàm tạo nút dịch
  function createTranslateButton() {
    if (document.getElementById('laongu-translate-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'laongu-translate-btn';
    button.innerHTML = '🌐 Dịch';
    button.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    button.addEventListener('click', handleTranslateClick);
    document.body.appendChild(button);
  }

  // Hàm xử lý khi nhấn nút dịch
  async function handleTranslateClick() {
    try {
      console.log('🎯 Bắt đầu dịch trang...');
      
      const button = document.getElementById('laongu-translate-btn');
      button.innerHTML = '⏳ Đang dịch...';
      button.disabled = true;

      // Kiểm tra xem trang có chứa tiếng Trung không
      const isChinese = document.title.match(/[\u3400-\u9FBF]/) || 
                       document.body.innerText.match(/[\u3400-\u9FBF]/);
      
      if (!isChinese) {
        alert('Trang này không chứa tiếng Trung. Không cần dịch.');
        button.innerHTML = '🌐 Dịch';
        button.disabled = false;
        return;
      }

      // Thực hiện dịch
      await translateNode(document.body);
      
      button.innerHTML = '✅ Đã dịch';
      setTimeout(() => {
        button.innerHTML = '🌐 Dịch';
        button.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('❌ Lỗi dịch trang:', error);
      const button = document.getElementById('laongu-translate-btn');
      button.innerHTML = '❌ Lỗi';
      button.disabled = false;
    }
  }

  // Hàm dịch node (giữ nguyên từ userscript)
  async function translateNode(domNode) {
    const excludedTags = new Set(['SCRIPT', 'STYLE', 'BR', 'HR']);
    const stackToStockThings = [];

    function traverseDOM(node) {
      if (node.nodeType === Node.TEXT_NODE && containsChinese(node.nodeValue)) {
        stackToStockThings.push(node);
      } else if (node.nodeType === Node.ELEMENT_NODE && !excludedTags.has(node.tagName.toUpperCase())) {
        for (const childNode of node.childNodes) {
          traverseDOM(childNode);
        }
      }
    }

    traverseDOM(domNode);

    const chineseText = stackToStockThings.map(node => node.nodeValue).join('---|---');

    try {
      // Tải từ điển từ file local
      const dictionary = new Dictionary();
      await dictionary.init();
      const translatedText = dictionary.translate(replaceName(chineseText));

      const translatedArr = translatedText.split('---|---');
      for (let i = 0; i < stackToStockThings.length; i++) {
        stackToStockThings[i].nodeValue = translatedArr[i];
      }
    } catch (error) {
      console.error('Lỗi Dịch:', error);
    }
  }

  // Hàm kiểm tra chứa tiếng Trung
  function containsChinese(text) {
    const chineseRegex = /[\u4E00-\u9FA5]/;
    return chineseRegex.test(text);
  }

  // Hàm xử lý HTML (giữ nguyên từ userscript)
  function html2text(html, noBr = false) {
    html = html.replace(/<style([\s\S]*?)<\/style>/gi, '');
    html = html.replace(/<script([\s\S]*?)<\/script>/gi, '');
    html = html.replace(/<\/(div|p|li|dd|h[1-6])>/gi, '\n');
    html = html.replace(/<(br|hr)\s*[/]?>/gi, '\n');
    html = html.replace(/<li>/ig, '+ ');
    html = html.replace(/<[^>]+>/g, '');
    html = html.replace(/\n{3,}/g, '\n\n');
    if (noBr) html = html.replace(/\n+/g, ' ');
    return html;
  }

  // Khởi tạo khi trang load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTranslation);
  } else {
    initializeTranslation();
  }

  // Hàm để popup gọi
  window.activateTranslation = function() {
    handleTranslateClick();
  };

  // Lắng nghe message từ popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate_page') {
      handleTranslateClick();
      sendResponse({success: true});
    }
    return true;
  });

})();