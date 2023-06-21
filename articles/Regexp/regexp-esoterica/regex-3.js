//将yyyy-mm-dd格式，替换成mm/dd/yyyy
var string = '2023-06-16';
var regex = /^(\d{4})-(\d{2})-(\d{2})$/g;
var result = string.replace(regex, '$2/$3/$1'); // => 06/16/2023

//将yyyy-mm-dd格式，替换成mm/dd/yyyy
var string = '2023-06-16';
var regex = /^(\d{4})-(\d{2})-(\d{2})$/g;
var result = string.replace(regex, () => `${RegExp.$2}/${RegExp.$3}/${RegExp.$1}`);

//将yyyy-mm-dd格式，替换成mm/dd/yyyy
var string = '2023-06-16';
var regex = /^(\d{4})-(\d{2})-(\d{2})$/g;
var result = string.replace(regex, (match, year, month, day) => `${month}/${day}/${year}`);

//有三个这样的日期字符串'2023-06-16'、'2023.06.16'、'2023/06/16'，写一个正则匹配这样的字符串
var regex = /^\d{4}(-|\/|\.)\d{2}\1\d{2}$/;
console.log(regex.test('2023-06-16'), regex.test('2023.06.16'), regex.test('2023/06/16'), regex.test('2023-06/16'))

var regex = /^((\d)(\d(\d)))\1\2\3\4$/;
var string = "1231231233";
regex.test(string)
console.log(RegExp.$1, RegExp.$2, RegExp.$3, RegExp.$4)

/* 分组匹配练习 */

//实现js字符串的trim方法
const myTrim = (str) => {
    let regex = /^(\s*)(.*?)(\s*)$/g
    return str.replace(regex, '$2')
};

//将一段英文中的每个单词的首字母换为大写
const toUpperCase = (str) => {
    let regex = /(^|\s)\w/g
    return str.replace(regex, match => {
        return match.toUpperCase()
    })
};

//驼峰化，将字符串'-moz-transform'变为'MozTransform'
const camelize = (str) => {
    let regex = /([-]+)(\w)/g
    return str.replace(regex, (match, $1, $2) => {
        return $2.toUpperCase()
    })
};

//逆驼峰化，将字符串'MozTransform'变为'-moz-transform'
const dasherize = (str) => {
    let regex = /([A-Z])/g
    return str.replace(regex, match => `-${match.toLowerCase()}`)
};

//html转义，将字符串'<div><div>test</div></div>'转义成'&lt;div&gt;&lt;div&gt;test&lt;/div&gt;&lt;/div&gt;'
const escapeHtml = (str) => {
    const escapeChars = {
        '¢': 'cent',
        '£': 'pound',
        '¥': 'yen',
        '€': 'euro',
        '©': 'copy',
        '®': 'reg',
        '<': 'lt',
        '>': 'gt',
        '"': 'quot',
        '&': 'amp',
        "'": '#39',
    };
    let regex = /([<>])/g
    return str.replace(regex, match => {
        return match === '<' ? `&${escapeChars['<']};` : `&${escapeChars['>']};`
    })
};

//html反转义，将字符串'&lt;div&gt;&lt;div&gt;test&lt;/div&gt;&lt;/div&gt;'转义成'<div><div>test</div></div>'
const unescapeHTML = (str) => {
    const escapeChars = {
        '¢': 'cent',
        '£': 'pound',
        '¥': 'yen',
        '€': 'euro',
        '©': 'copy',
        '®': 'reg',
        '<': 'lt',
        '>': 'gt',
        '"': 'quot',
        '&': 'amp',
        "'": '#39',
    };
    let regex = /&(.+?);/g
    return str.replace(regex, (match, s) => {
        const arr = Object.keys(escapeChars)
        let p = 0
        while (p < arr.length) {
            const item = arr[p]
            if (escapeChars[item] === s) {
                return item
            }
            p++
        }
    })
};

//判断html标签格式是否正确，匹配成对标签
const checkCouple = (str) => {
    let regex = /\<(.*?)\>.*?\<\/\1\>/g
    return regex.test(str)
};