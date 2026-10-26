/* LUXXI STORE — static GitHub Pages storefront.
   IMPORTANT: browser-only demo admin is not secure. Change ADMIN_PASSWORD before deployment.
   Product/settings edits are stored in localStorage on this browser only.
*/
const ADMIN_PASSWORD = "luxxi123"; // Ganti sebelum publish; bukan pengganti autentikasi backend.
const STORAGE = { products: "luxxi_products_v1", settings: "luxxi_settings_v1", cart: "luxxi_cart_v1" };
const DEFAULT_PRODUCTS = [
  {id:"lx-001",name:"Premium Digital",price:25000,category:"Akun Digital",description:"Produk digital pilihan untuk kebutuhan sehari-hari.",image:"",tag:"POPULAR"},
  {id:"lx-002",name:"Voucher Digital",price:15000,category:"Voucher",description:"Voucher praktis dengan proses pemesanan mudah.",image:"",tag:"PILIHAN"},
  {id:"lx-003",name:"Game Credit",price:50000,category:"Gaming",description:"Top up kebutuhan gaming favoritmu.",image:"",tag:"GAMING"},
  {id:"lx-004",name:"Membership",price:35000,category:"Membership",description:"Pilihan membership untuk pengalaman lebih lengkap.",image:"",tag:"DIGITAL"},
  {id:"lx-005",name:"Digital Service",price:20000,category:"Jasa Digital",description:"Layanan digital sesuai kebutuhanmu.",image:"",tag:"SERVICE"},
  {id:"lx-006",name:"Custom Request",price:0,category:"Lainnya",description:"Hubungi admin untuk harga dan ketersediaan.",image:"",tag:"CUSTOM"}
];
const DEFAULT_SETTINGS = { whatsapp:"6281234567890", storeName:"LUXXI STORE" };
let products = readStore(STORAGE.products, DEFAULT_PRODUCTS);
let settings = readStore(STORAGE.settings, DEFAULT_SETTINGS);
let cart = readStore(STORAGE.cart, []);
let activeCategory = "Semua";
let toastTimer;

function readStore(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : structuredClone(fallback); }
  catch { return structuredClone(fallback); }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(value)||0);
}
function safeText(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function showToast(message) {
  const el = document.getElementById("toast");
  el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}
function whatsappUrl(message) {
  const number = String(settings.whatsapp || "").replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
function syncStoreName() {
  document.title = `${settings.storeName || "LUXXI STORE"} — Digital Shop`;
  const ask = document.getElementById("ask-admin");
  ask.href = whatsappUrl(`Halo ${settings.storeName || "LUXXI STORE"}, saya ingin bertanya tentang produk.`);
}
function renderFilters() {
  const categories = ["Semua", ...new Set(products.map(p => p.category).filter(Boolean))];
  if (!categories.includes(activeCategory)) activeCategory = "Semua";
  document.getElementById("category-filters").innerHTML = categories.map(cat =>
    `<button class="filter-button ${cat===activeCategory?"active":""}" data-category="${safeText(cat)}">${safeText(cat)}</button>`
  ).join("");
}
function productCard(p) {
  const image = p.image && /^https?:\/\//i.test(p.image)
    ? `<img src="${safeText(p.image)}" alt="${safeText(p.name)}" loading="lazy" onerror="this.remove()">`
    : "";
  return `<article class="product-card">
    <div class="product-image">${image}<span class="product-placeholder" aria-hidden="true">L.</span><span class="product-tag">${safeText(p.tag || p.category || "DIGITAL")}</span></div>
    <div class="product-info"><span class="product-category">${safeText(p.category)}</span><h3>${safeText(p.name)}</h3><p>${safeText(p.description || "Produk digital pilihan LUXXI STORE.")}</p>
    <div class="product-bottom"><strong class="product-price">${Number(p.price)===0?"Hubungi admin":rupiah(p.price)}</strong><button class="add-button" data-add="${safeText(p.id)}" aria-label="Tambah ${safeText(p.name)} ke keranjang" title="Tambah ke keranjang">+</button></div></div>
  </article>`;
}
function renderProducts() {
  renderFilters();
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  const shown = products.filter(p => (activeCategory==="Semua" || p.category===activeCategory) &&
    `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query));
  document.getElementById("product-grid").innerHTML = shown.map(productCard).join("");
  document.getElementById("empty-state").classList.toggle("hidden", shown.length > 0);
}
function addToCart(id) {
  const product = products.find(p => p.id===id); if (!product) return;
  const existing = cart.find(item => item.id===id);
  if (existing) existing.qty += 1; else cart.push({id,qty:1});
  saveStore(STORAGE.cart,cart); renderCart(); showToast(`${product.name} ditambahkan ke keranjang`);
}
function getCartProducts() {
  return cart.map(item => ({...item, product:products.find(p=>p.id===item.id)})).filter(item=>item.product);
}
function renderCart() {
  cart = cart.filter(item => products.some(p=>p.id===item.id));
  saveStore(STORAGE.cart,cart);
  const items = getCartProducts();
  const count = items.reduce((sum,item)=>sum+item.qty,0);
  const total = items.reduce((sum,item)=>sum+(Number(item.product.price)||0)*item.qty,0);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-item-count").textContent = `(${count})`;
  document.getElementById("cart-items").innerHTML = items.map(({id,qty,product})=>`
    <div class="cart-row"><div><h4>${safeText(product.name)}</h4><small>${rupiah(product.price)} × ${qty}</small></div>
    <div class="cart-row-actions"><button class="qty-button" data-qty="-1" data-id="${safeText(id)}" aria-label="Kurangi">−</button><span>${qty}</span><button class="qty-button" data-qty="1" data-id="${safeText(id)}" aria-label="Tambah">+</button><button class="remove-button" data-remove="${safeText(id)}" aria-label="Hapus">×</button></div></div>`).join("");
  document.getElementById("cart-total").textContent = rupiah(total);
  document.getElementById("cart-empty").classList.toggle("hidden",items.length>0);
  document.getElementById("cart-summary").classList.toggle("hidden",items.length===0);
}
function changeQty(id,delta) {
  const item=cart.find(i=>i.id===id); if(!item)return;
  item.qty+=delta; if(item.qty<=0)cart=cart.filter(i=>i.id!==id);
  saveStore(STORAGE.cart,cart);renderCart();
}
function checkout() {
  const items=getCartProducts(); if(!items.length)return;
  const lines=items.map(({qty,product})=>`• ${product.name} (${qty}x) — ${rupiah(product.price*qty)}`);
  const total=items.reduce((sum,item)=>sum+item.qty*Number(item.product.price||0),0);
  const message=`Halo ${settings.storeName || "LUXXI STORE"}, saya ingin memesan:\n\n${lines.join("\n")}\n\nTotal: ${rupiah(total)}\n\nNama pembeli: \nMohon konfirmasi stok dan cara pembayaran.`;
  window.open(whatsappUrl(message),"_blank","noopener,noreferrer");
}
function openOverlay(id) { document.getElementById(id).classList.add("open");document.getElementById(id).setAttribute("aria-hidden","false");document.body.style.overflow="hidden"; }
function closeOverlay(id) {
  document.getElementById(id).classList.remove("open");document.getElementById(id).setAttribute("aria-hidden","true");
  if(!document.querySelector(".overlay.open"))document.body.style.overflow="";
}
function adminStatus(message) { document.getElementById("admin-status").textContent=message; }
function renderAdminProducts() {
  document.getElementById("admin-product-list").innerHTML=products.map(p=>`<div class="admin-product-row"><div><strong>${safeText(p.name)}</strong><small>${rupiah(p.price)} · ${safeText(p.category)}</small></div><div class="admin-product-actions"><button data-edit="${safeText(p.id)}">Edit</button><button class="delete-product" data-delete="${safeText(p.id)}">Hapus</button></div></div>`).join("") || '<p class="form-hint">Belum ada produk.</p>';
}
function resetProductForm() {
  document.getElementById("product-form").reset();document.getElementById("product-id").value="";
  document.getElementById("product-form-title").textContent="Tambah produk";
  document.getElementById("save-product").textContent="Simpan produk";
  document.getElementById("cancel-edit").classList.add("hidden");
}
function editProduct(id) {
  const p=products.find(item=>item.id===id);if(!p)return;
  document.getElementById("product-id").value=p.id;
  document.getElementById("product-name").value=p.name;
  document.getElementById("product-price").value=p.price;
  document.getElementById("product-category").value=p.category;
  document.getElementById("product-image").value=p.image||"";
  document.getElementById("product-description").value=p.description||"";
  document.getElementById("product-form-title").textContent="Edit produk";
  document.getElementById("save-product").textContent="Simpan perubahan";
  document.getElementById("cancel-edit").classList.remove("hidden");
  document.getElementById("product-form-title").scrollIntoView({behavior:"smooth",block:"center"});
}
function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  document.getElementById("admin-products-tab").classList.toggle("hidden",tab!=="products");
  document.getElementById("admin-settings-tab").classList.toggle("hidden",tab!=="settings");
}
function loginAdmin(event) {
  event.preventDefault();
  if(document.getElementById("admin-password").value!==ADMIN_PASSWORD){adminStatus("Password salah.");return;}
  document.getElementById("admin-login").classList.add("hidden");
  document.getElementById("admin-dashboard").classList.remove("hidden");
  document.getElementById("settings-whatsapp").value=settings.whatsapp;
  document.getElementById("settings-store-name").value=settings.storeName;
  renderAdminProducts();adminStatus("Panel dibuka di browser ini.");
}
function logoutAdmin() {
  document.getElementById("admin-login").classList.remove("hidden");
  document.getElementById("admin-dashboard").classList.add("hidden");
  document.getElementById("admin-password").value="";adminStatus("Kamu sudah keluar.");
}
document.getElementById("product-grid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)addToCart(b.dataset.add);});
document.getElementById("category-filters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){activeCategory=b.dataset.category;renderProducts();}});
document.getElementById("search-input").addEventListener("input",renderProducts);
document.getElementById("cart-items").addEventListener("click",e=>{
  const q=e.target.closest("[data-qty]"),r=e.target.closest("[data-remove]");
  if(q)changeQty(q.dataset.id,Number(q.dataset.qty));
  if(r){cart=cart.filter(i=>i.id!==r.dataset.remove);saveStore(STORAGE.cart,cart);renderCart();}
});
document.getElementById("cart-open").addEventListener("click",()=>openOverlay("cart-overlay"));
document.getElementById("admin-open").addEventListener("click",()=>{openOverlay("admin-overlay");adminStatus("");});
document.getElementById("checkout-button").addEventListener("click",checkout);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeOverlay(b.dataset.close)));
document.querySelectorAll(".overlay").forEach(overlay=>overlay.addEventListener("click",e=>{if(e.target===overlay)closeOverlay(overlay.id);}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".overlay.open").forEach(o=>closeOverlay(o.id));});
document.getElementById("admin-login-form").addEventListener("submit",loginAdmin);
document.getElementById("admin-logout").addEventListener("click",logoutAdmin);
document.getElementById("cancel-edit").addEventListener("click",resetProductForm);
document.querySelector(".admin-tabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)switchAdminTab(b.dataset.tab);});
document.getElementById("product-form").addEventListener("submit",e=>{
  e.preventDefault();
  const id=document.getElementById("product-id").value;
  const name=document.getElementById("product-name").value.trim();
  const price=Number(document.getElementById("product-price").value);
  const category=document.getElementById("product-category").value.trim();
  const image=document.getElementById("product-image").value.trim();
  const description=document.getElementById("product-description").value.trim();
  if(!name||!category||!Number.isFinite(price)||price<0){adminStatus("Periksa nama, kategori, dan harga.");return;}
  if(image && !/^https?:\/\//i.test(image)){adminStatus("URL gambar harus diawali http:// atau https://");return;}
  const old=products.find(p=>p.id===id);
  const item={id:id||`lx-${Date.now()}`,name,price,category,image,description,tag:old?.tag||"DIGITAL"};
  if(id)products=products.map(p=>p.id===id?item:p);else products.push(item);
  saveStore(STORAGE.products,products);resetProductForm();renderProducts();renderAdminProducts();adminStatus("Produk berhasil disimpan di browser ini.");
});
document.getElementById("admin-product-list").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
  if(edit)editProduct(edit.dataset.edit);
  if(del){const p=products.find(x=>x.id===del.dataset.delete);if(p&&confirm(`Hapus produk "${p.name}"?`)){products=products.filter(x=>x.id!==p.id);saveStore(STORAGE.products,products);renderProducts();renderCart();renderAdminProducts();adminStatus("Produk dihapus dari browser ini.");}}
});
document.getElementById("settings-form").addEventListener("submit",e=>{
  e.preventDefault();
  const whatsapp=document.getElementById("settings-whatsapp").value.replace(/\D/g,"");
  const storeName=document.getElementById("settings-store-name").value.trim();
  if(whatsapp.length<9||!storeName){adminStatus("Masukkan nama toko dan nomor WhatsApp yang valid.");return;}
  settings={whatsapp,storeName};saveStore(STORAGE.settings,settings);syncStoreName();adminStatus("Pengaturan tersimpan di browser ini.");showToast("Pengaturan toko disimpan");
});
document.getElementById("year").textContent=new Date().getFullYear();
syncStoreName();renderProducts();renderCart();
