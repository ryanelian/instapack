import * as chalk from 'chalk';

function padZeroToDoubleDigits(x: number) {
    let s = '';
    if (x < 10){
        s += '0';
    }
    s += x;
    return s;
}

function getTimeFormatHHMMSS(){
    let t = new Date();
    return padZeroToDoubleDigits(t.getHours()) + ':' + padZeroToDoubleDigits(t.getMinutes()) + ':' + padZeroToDoubleDigits(t.getSeconds());
}

export default function GulpLog(...tokens: any[]) {
    let output = '[' + chalk.grey(getTimeFormatHHMMSS()) + ']';
    for (let i = 0; i < tokens.length; i++) {
        output += ' ' + tokens[i];
    }
    console.log(output);
}
