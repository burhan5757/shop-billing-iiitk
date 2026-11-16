const token = localStorage.getItem('token');

if(!token){
    window.location.href = 'login.html';
}

const msg = document.getElementById('msg');
const productRows = document.getElementById('product-rows');
const billRows = document.getElementById('bill-rows');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const stockFilter = document.getElementById('stock-filter');
const productForm = document.getElementById('product-form');

let products = [];

const logout = () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

document.getElementById('logout').addEventListener('click',(e)=>{
    e.preventDefault();
    logout();
})

const api = async (url, options = {}) => {
    const res = await fetch(url,{
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    });

    if(res.status === 401){
        logout();
    }

    return res;
}

const showMsg = (text,type) => {
    msg.textContent = text;
    msg.className = `msg ${type}`;
}

const stockStatus = (quantity) => {
    if(quantity === 0) return { level: 'low', text: 'Out of Stock' };
    if(quantity < 10) return { level: 'medium', text: 'Low Stock' };
    return { level: 'high', text: 'In Stock' };
}

const cell = (text) => {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

const emptyRow = (colspan, text) => {
    const tr = document.createElement('tr');
    const td = cell(text);
    td.colSpan = colspan;
    td.className = 'empty';
    tr.appendChild(td);
    return tr;
}



const renderProducts = () => {
    const search = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const stock = stockFilter.value;

    const list = products.filter(product =>
        product.product_name.toLowerCase().includes(search) &&
        (!category || product.category === category) &&
        (!stock || stockStatus(product.quantity).level === stock)
    );

    productRows.innerHTML = '';

    if(list.length === 0){
        productRows.appendChild(emptyRow(7, 'No products found'));
        return;
    }

    for(const product of list){
        const tr = document.createElement('tr');
        const status = stockStatus(product.quantity);

        tr.appendChild(cell(product.product_id));
        tr.appendChild(cell(product.product_name));
        tr.appendChild(cell(product.category || '-'));
        tr.appendChild(cell(Number(product.price).toFixed(2)));
        tr.appendChild(cell(product.quantity));

        const statusTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'stock-badge';
        badge.textContent = status.text;
        statusTd.appendChild(badge);
        tr.appendChild(statusTd);

        const actionTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteProduct(product));
        actionTd.appendChild(deleteBtn);
        tr.appendChild(actionTd);

        productRows.appendChild(tr);
    }
}

const renderCategories = () => {
    const selected = categoryFilter.value;
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

    categoryFilter.innerHTML = '<option value="">All Categories</option>';

    for(const category of categories){
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    }

    categoryFilter.value = categories.includes(selected) ? selected : '';
}

const loadProducts = async () => {
    try{
        const res = await fetch('/api/products');
        const data = await res.json();

        if(!res.ok){
            productRows.innerHTML = '';
            productRows.appendChild(emptyRow(7, data.msg));
            return;
        }

        products = data.products;

        document.getElementById('total-products').textContent = products.length;
        renderCategories();
        renderProducts();

    } catch(err){
        productRows.innerHTML = '';
        productRows.appendChild(emptyRow(7, 'Server not reachable'))
    }
}

const deleteProduct = async (product) => {
    if(!confirm(`Delete "${product.product_name}"?`)){
        return;
    }

    const res = await api(`/api/products/${product.product_id}`, { method: 'DELETE' });
    const data = await res.json();

    showMsg(data.msg, res.ok ? 'success' : 'error');

    if(res.ok){
        loadProducts();
    }
}

document.getElementById('toggle-form').addEventListener('click', () => {
    productForm.classList.toggle('open');
})

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
        product_name: document.getElementById('product-name').value.trim(),
        category: document.getElementById('product-category').value.trim() || null,
        price: Number(document.getElementById('product-price').value),
        quantity: Number(document.getElementById('product-quantity').value)
    };

    const res = await api('/api/products',{
        method: 'POST',
        body: JSON.stringify(body)
    });
    const data = await res.json();

    showMsg(data.msg, res.ok ? 'success' : 'error');

    if(res.ok){
        productForm.reset();
        productForm.classList.remove('open');
        loadProducts();
    }
});

searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);
stockFilter.addEventListener('change', renderProducts);



const loadBills = async () => {
    try{
        const res = await api('/api/bills');
        const data = await res.json();

        billRows.innerHTML = '';

        if(!res.ok){
            billRows.appendChild(emptyRow(5, data.msg));
            return;
        }

        const bills = data.bills;

        const totalPaise = bills.reduce(
            (total, bill) => total + Math.round(Number(bill.total_amount) * 100),
            0
        );

        document.getElementById('total-sales').textContent = (totalPaise / 100).toFixed(2);
        document.getElementById('total-bills').textContent = bills.length;

        if(bills.length === 0){
            billRows.appendChild(emptyRow(5, 'No bills yet'));
            return;
        }

        for(const bill of bills){
            const tr = document.createElement('tr');

            tr.appendChild(cell(bill.bill_number));
            tr.appendChild(cell(new Date(bill.created_at).toLocaleString('en-IN')));

            const items = bill.items
                .map(item => `${item.product_name} x ${item.quantity}`)
                .join(', ');
            const itemsTd = cell(items);
            itemsTd.className = 'item-list';
            tr.appendChild(itemsTd);

            tr.appendChild(cell(bill.payment_method));
            tr.appendChild(cell(Number(bill.total_amount).toFixed(2)));

            billRows.appendChild(tr);
        }

    } catch(err){
        billRows.innerHTML = '';
        billRows.appendChild(emptyRow(5, 'Server not reachable'));
    }
}

if(token){
    loadProducts();
    loadBills();
}
