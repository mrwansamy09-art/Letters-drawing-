// تهيئة الرسم - الكود المصحح
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const message = document.getElementById('message');

// إعدادات الرسم
ctx.lineWidth = 10;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// مسار حرف الألف
const letterPath = [
    {x: 200, y: 300},  // بداية - أسفل
    {x: 200, y: 250},
    {x: 200, y: 200},
    {x: 200, y: 150},  // نهاية - أعلى
];

let isDrawing = false;
let userPoints = [];

// ========== 1. رسم المسار الإرشادي ==========
function drawGuide() {
    // مسح الكانفس أولاً
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم المسار المنقط
    ctx.setLineDash([15, 10]);  // خط منقط: 15px خط، 10px فراغ
    ctx.strokeStyle = '#cbd5e0'; // لون رمادي فاتح
    ctx.lineWidth = 8;
    
    ctx.beginPath();
    ctx.moveTo(letterPath[0].x, letterPath[0].y);
    
    for (let i = 1; i < letterPath.length; i++) {
        ctx.lineTo(letterPath[i].x, letterPath[i].y);
    }
    
    ctx.stroke();
    ctx.setLineDash([]); // إعادة الخط العادي
    
    // رسم النقاط الزرقاء على المسار
    letterPath.forEach((point, index) => {
        ctx.fillStyle = '#4299e1'; // أزرق
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // دائرة بيضاء داخل النقطة
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // إضافة سهم في بداية المسار
    drawArrow(letterPath[0].x, letterPath[0].y + 20, letterPath[0].x, letterPath[0].y, '#4299e1');
}

// دالة لرسم سهم
function drawArrow(fromX, fromY, toX, toY, color) {
    const headlen = 15;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // رأس السهم
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), 
               toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), 
               toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

// ========== 2. أحداث الرسم ==========
// إعداد المستمعين للأحداث
function setupEventListeners() {
    // للماوس
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // للشاشات اللمسية
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            startDrawing(e.touches[0]);
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            draw(e.touches[0]);
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    userPoints = [];
    
    const pos = getCanvasPosition(e);
    userPoints.push(pos);
    
    // بدء الرسم من النقطة الأولى
    ctx.strokeStyle = '#2b6cb0'; // أزرق داكن
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    message.textContent = '✏️ ارسم على المسار المنقط...';
    message.style.color = '#2b6cb0';
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getCanvasPosition(e);
    userPoints.push(pos);
    
    // رسم خط إلى النقطة الحالية
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    // التحقق من القرب من المسار
    checkIfOnPath(pos);
}

function stopDrawing() {
    if (!isDrawing) return;
    
    isDrawing = false;
    ctx.closePath();
    
    // حساب النقاط المرسومة
    if (userPoints.length > 20) {
        message.textContent = '👍 جيد! يمكنك المحاولة مرة أخرى';
        message.style.color = '#38a169';
    } else {
        message.textContent = '✏️ حاول رسم خط أطول على المسار';
        message.style.color = '#e53e3e';
    }
}

// ========== 3. دوال مساعدة ==========
function getCanvasPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function checkIfOnPath(userPoint) {
    // تحقق من أقرب نقطة في المسار
    let minDistance = Infinity;
    
    for (const point of letterPath) {
        const dist = Math.sqrt(
            Math.pow(userPoint.x - point.x, 2) + 
            Math.pow(userPoint.y - point.y, 2)
        );
        
        if (dist < minDistance) {
            minDistance = dist;
        }
    }
    
    // إذا كان قريباً من المسار (ضمن 25 بيكسل)
    if (minDistance < 25) {
        // إذا رسم معظم المسار
        if (userPoints.length > 30) {
            message.textContent = '🎉 مبروك! أكملت كتابة الحرف!';
            message.style.color = '#2f855a';
            
            // إعلام FlutterFlow
            if (window.parent) {
                window.parent.postMessage('LETTER_COMPLETED_ALIF', '*');
            }
        }
        return true;
    }
    
    return false;
}

function resetDrawing() {
    userPoints = [];
    message.textContent = '✏️ ابدأ الرسم من النقطة السفلية';
    message.style.color = '#4a5568';
    drawGuide(); // إعادة رسم المسار
}

// ========== 4. تهيئة التطبيق ==========
// بدء التطبيق عند تحميل الصفحة
window.addEventListener('load', function() {
    drawGuide();
    setupEventListeners();
    
    message.textContent = '✏️ اسحب إصبعك من النقطة السفلية إلى الأعلى';
    message.style.color = '#4a5568';
    
    // جعل زر إعادة المحاولة يعمل
    document.getElementById('resetBtn').addEventListener('click', resetDrawing);
});
