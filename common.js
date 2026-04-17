/**
 * common.js
 * 기본 JavaScript 템플릿
 * Author: Your Name
 * Description: 간단한 구조 + 유틸 함수 + 실행 예제
 */

// ==============================
// 실행 (Entry Point)
// ==============================

function fnalert(value){
  alert(value);
}

// RP계산기 이동
function fnMachine(){
  window.location.href = "rpMachine.html";
}

function fnExpCalc() {
    const exp = prompt("현재 경험치를 입력하세요:");

    if (!exp || isNaN(exp)) {
        alert("숫자를 입력하세요!");
        return;
    }

    const info = getLevelInfo(Number(exp));

    alert(
        `레벨: ${info.level}\n` +
        `진행률: ${info.progressPercent}%\n` +
        `남은 경험치: ${info.remainExp}`
    );
}
