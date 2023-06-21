var string = 'a1c a2c a3c a4c';
var regex = /a[123]c/g;
var result = string.match(regex);

var string = '123 1234 12345 123456';
var regex = /\d{2,5}/g;
var result = string.match(regex);

var string = '123 1234 12345 123456';
var regex = /\d{2,5}?/g;
var result = string.match(regex);

var string = 'apples';
var regex1 = /apple|apples/g;
var regex2 = /apples|apple/g
var res1 = string.match(regex1)
var res2 = string.match(regex2)

/* 字符串匹配练习 */

//有这样一个字符串'abc?*^&'，要求得到所有字符组成的数组
const getAllChat = (str) => {
    return str.match(/[\w\W]/g)
};

//有这样一个16进制的颜色字符串'#ffbbad #Fc01DF #FFF #ffE #ffd2'，要求得到所有的颜色组成的数组
const getAllColor = (str) => {
    return str.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/g)
};

//有这样的一些字符串'23:59','02:07','2:7','2:68'，它们都是24小时制的时间，判断它们是否是正确的时间
const checkTime = (str) => {
    let regex = /^([0-1]\d|2[0-3]):([0-5][0-9])$/
    // 上面的正则表达式不能判断这样的时间'2:7'，再优化下
    regex = /^((0?|1)\d|2[0-3]):((0?|[1-5])\d)$/
    return regex.test(str)
};

//要求判断日期字符串'2023-06-16'、'2023-6-6'、'2022-12-35'是否是正确的日期
const checkDay = (str) => {
    let regex = /^\d{4}-(0?[0-9]|1[1-2])-(0?[1-9]|[12][0-9]|3[01])$/
    return regex.test(str)
};

//有这样一个window操作系统文件路径的字符串'F:\study\javascript\regex\regular expression.pdf'，判断其是否正确
const checkPath = (str) => {
    // [^\\:*<>|"?\r\n/]+ 表示合法的文件名或文件夹名，至少有个一个字符
    let regex = /^[a-zA-Z]:\\([^\\:*<>|"?\r\n/]+\\)*([^\\:*<>|"?\r\n/]+)?$/
    return regex.test(str)
};

//有这样一个html标签的字符串'<div id="container" class="main"></div>'，要求提取出id="container"
const getId = (str) => {
    let regex = /id=".*"/g
    //此时会匹配id="container" class="main"，因为量词是贪婪匹配，只需要在量词后加个?即可
    regex = /id=".*?"/
    return str.match(regex)[0]
};
