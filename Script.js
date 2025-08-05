
const API_URL = 'https://script.google.com/macros/s/AKfycbwJo0y5foOthYEuSXQcWlcy4-8RvlMrKoMX_P5mgoe0jq9dMtQTsuuhzWLqI6lHAyMQ/exec';
let palletOpened = false;

function openPallet() {
  if (!palletOpened) {
    document.getElementById('modalTransport').style.display = 'flex';
  } else {
    // นับจำนวนรายการก่อนเคลียร์
    const currentData = JSON.parse(localStorage.getItem('trackingData') || '[]');
    const itemCount = currentData.length;
    
    // ปิดงานและเคลียร์ข้อมูล
    palletOpened = false;
    document.getElementById('togglePalletBtn').innerHTML = '🔓 เปิดรหัส Pallet';
    document.getElementById('palletID').textContent = 'Not Work ID';
    document.getElementById('transport').style.display = 'none';
    
    // เคลียร์ localStorage
    localStorage.removeItem('trackingData');
    
    // อัพเดท UI
    renderLocalData();
    
    // แจ้งเตือนจำนวน Pallet ที่ปิด
    if (itemCount > 0) {
      showSuccessModal(`🎉 ปิดงานเรียบร้อยแล้ว! \n จำนวน: ${itemCount} รายการ`);
    } else {
      showAlertModal("✅ ปิดงานเรียบร้อยแล้ว!\n(ไม่มีรายการในระบบ)");
    }
  }
}

function selectTransport() {
  const selected = document.getElementById('modalTransportSelect').value;
  document.getElementById('transport').value = selected;
  document.getElementById('transport').style.display = 'none';
  const id = Math.floor(100000 + Math.random() * 900000);
  document.getElementById('palletID').textContent = id;
  palletOpened = true;
  document.getElementById('togglePalletBtn').innerHTML = '❌ ปิดงาน';
  document.getElementById('modalTransport').style.display = 'none';
}

function saveData() {
  const data = {
    id: document.getElementById('palletID').textContent,
    tracking: document.getElementById('tracking').value,
    seller: document.getElementById('seller').value,
    transport: document.getElementById('palletID').textContent ? document.getElementById('transport').value : '',
    qty: 1
  };
  
  if (!data.id) {
    showAlertModal("Please press open firs‼️\n กดปุ่มเปิดรหัสก่อน‼️");
    return;
  }
 
  if (!data.tracking) {
    showAlertModal("Please input Tracking Number first‼️\n กรุณากรอก Tracking Number ก่อน‼️");
    return;
  }
 

  
  let local = JSON.parse(localStorage.getItem('trackingData') || '[]');
  local.push(data);
  localStorage.setItem('trackingData', JSON.stringify(local));
  showSuccessModal("✨ บันทึกข้อมูลเรียบร้อยแล้ว!");
  renderLocalData();
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'add', payload: data })
  }).then(res => res.text()).then(console.log);
}

function renderLocalData() {
  const list = document.getElementById('localData');
  list.innerHTML = '';
  const local = JSON.parse(localStorage.getItem('trackingData') || '[]');
  document.getElementById('dataCount').textContent = local.length;
  local.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
  ${item.tracking}
 
  <button onclick='editItem(${index})' title="แก้ไข"><i class="fas fa-pen" style="font-size: 16px;"></i></button>
  <button onclick="deleteItem(${index})" title="ลบ"><i class="fas fa-trash" style="font-size: 16px;"></i></button>`;
    list.appendChild(li);
  });
  document.getElementById('tracking').value = '';
}

let currentEditIndex = null;

function editItem(index) {
  const local = JSON.parse(localStorage.getItem('trackingData') || '[]');
  const item = local[index];

  document.getElementById('editSeller').value = item.seller;
  document.getElementById('editTransport').value = item.transport;
  document.getElementById('editModal').style.display = 'flex';

  currentEditIndex = index;
}

function confirmEdit() {
  const newSeller = document.getElementById('editSeller').value.trim();
  const newTransport = document.getElementById('editTransport').value.trim();

  if (!newSeller || !newTransport) {
    showAlertModal("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  let local = JSON.parse(localStorage.getItem('trackingData') || '[]');
  const item = local[currentEditIndex];

  item.seller = newSeller;
  item.transport = newTransport;
  local[currentEditIndex] = item;
  localStorage.setItem('trackingData', JSON.stringify(local));
  showSuccessModal("✨ แก้ไข้อมูลเรียบร้อยแล้ว!");
  renderLocalData();

  // API Update
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'update',
      payload: {
        ID: item.id,
        Tracking: item.tracking,
        Seller: newSeller,
        Transport: newTransport,
        Category: 'สินค้าทั่วไป',
        qty: 1
      }
    })
  }).then(res => res.text()).then(console.log);

  document.getElementById('editModal').style.display = 'none';
}

// ปิด modal เมื่อคลิกนอกกล่อง
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('editModal');
  modal.addEventListener('click', function(e){
    if (e.target === modal) modal.style.display = 'none';
  });
});


function deleteItem(index) {
  const local = JSON.parse(localStorage.getItem('trackingData') || '[]');
  const item = local[index];
  local.splice(index, 1);
  localStorage.setItem('trackingData', JSON.stringify(local));
  renderLocalData();
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete',
      payload: {
        id: item.id,
        tracking: item.tracking
      }
    })
  }).then(res => res.text()).then(console.log);
}

window.onload = function() {
  renderLocalData();
  document.getElementById('modalTransport').addEventListener('click', function(e){
    if (e.target === this) this.style.display = 'none';
  });
  document.getElementById('tracking').addEventListener('keyup', function(e){
    if (e.key === "Enter") {
      saveData();
    }
  });
};
// make global for inline onclick
window.editItem = editItem;
window.deleteItem = deleteItem;
window.openPallet = openPallet;
window.selectTransport = selectTransport;

// ฟังก์ชัน Alert แบบ Modal Responsive
function showAlertModal(msg, callback) {
  document.getElementById('alertModalMsg').innerText = msg;
  document.getElementById('alertModal').style.display = "flex";
  // ปิด modal ด้วยปุ่มตกลง หรือคลิกนอกกล่อง
  document.getElementById('alertModal').onclick = function(e){
    if (e.target === this) closeAlertModal(callback);
  };
  document.querySelector('.alert-modal-btn').onclick = function() {
    closeAlertModal(callback);
  };
}
function closeAlertModal(callback) {
  document.getElementById('alertModal').style.display = "none";
  if (typeof callback === 'function') callback();
}
    
// เพิ่มฟังก์ชันนี้ใน script
function showSuccessModal(msg, callback) {
  document.querySelector('.success-modal-msg').innerText = msg;
  document.querySelector('.success-alert-modal').style.display = "flex";
  
  document.querySelector('.success-alert-modal').onclick = function(e){
    if (e.target === this) closeSuccessModal(callback);
  };
  document.querySelector('.success-modal-btn').onclick = function() {
    closeSuccessModal(callback);
  };
}

function closeSuccessModal(callback) {
  document.querySelector('.success-alert-modal').style.display = "none";
  if (typeof callback === 'function') callback();
}