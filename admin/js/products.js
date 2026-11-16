const msg = document.getElementById('msg');
const productRows = document.getElementById('product-rows');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');

let products = [];

const getCart = () => {
    try{
        return JSON.parse(localStorage.getItem('cart')) || [];
    } catch(err){
        return [];
    }
}

const saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

const updateCartCount = () => {
    const count = getCart().reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

const showMsg = (text,type) => {
    msg.textContent = text;
    msg.className = `msg ${type}`;
}

const cell = (text) => {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

const addToCart = (product) => {
    const cart = getCart();
    const item = cart.find(i => i.product_id === product.product_id);
    const inCart = item ? item.quantity : 0;

    if(inCart + 1 > product.quantity){
        showMsg(`Only ${product.quantity} ${product.product_name} in stock`, 'error');
        return;
    }

    if(item){
        item.quantity += 1;
    } else {
        cart.push({ product_id: product.product_id, quantity: 1 });
    }

    saveCart(cart);
    showMsg(`${product.product_name} added to cart`, 'success')
}

const renderProducts = () => {
    const search = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;

    const list = products.filter(product =>
        product.product_name.toLowerCase().includes(search) &&
        (!category || product.category === category)
    );

    productRows.innerHTML = '';

    if(list.length === 0){
        const tr = document.createElement('tr');
        const td = cell('No products found');
        td.colSpan = 6;
        td.className = 'empty';
        tr.appendChild(td);
        productRows.appendChild(tr);
        return;
    }

    for(const product of list){
        const tr = document.createElement('tr');

        tr.appendChild(cell(product.product_id));
        tr.appendChild(cell(product.product_name));
        tr.appendChild(cell(product.category || '-'));
        tr.appendChild(cell(Number(product.price).toFixed(2)));

        const stockTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'stock-badge';
        badge.textContent = product.quantity;
        stockTd.appendChild(badge);
        tr.appendChild(stockTd);

        const actionTd = document.createElement('td');
        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';

        if(product.quantity === 0){
            addBtn.textContent = 'Out of stock';
            addBtn.disabled = true;
        } else {
            addBtn.textContent = '+ Add to Cart';
            addBtn.addEventListener('click', () => addToCart(product));
        }

        actionTd.appendChild(addBtn);
        tr.appendChild(actionTd);

        productRows.appendChild(tr);
    }
}

const loadProducts = async () => {
    try{
        const res = await fetch('/api/products');
        const data = await res.json();

        if(!res.ok){
            showMsg(data.msg, 'error');
            return;
        }

        products = data.products;

        const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

        for(const category of categories){
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }

        renderProducts();

    } catch(err){
        showMsg('Server not reachable', 'error');
    }
}

searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);

updateCartCount();
loadProducts();
