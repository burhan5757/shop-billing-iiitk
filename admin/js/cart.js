const msg = document.getElementById('msg');
const cartRows = document.getElementById('cart-rows');
const searchInput = document.getElementById('product-search');
const quantityInput = document.getElementById('add-quantity');
const productOptions = document.getElementById('product-options');
const generateBtn = document.getElementById('generate-bill');

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
}

const showMsg = (text,type) => {
    msg.textContent = text;
    msg.className = `msg ${type}`;
}

const findProduct = (product_id) => products.find(p => p.product_id === product_id);

const toPaise = (price) => Math.round(Number(price) * 100);
const formatRupees = (paise) => (paise / 100).toFixed(2);

const cell = (text) => {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

const cleanCart = () => {
    const cart = getCart()
        .filter(item => findProduct(item.product_id) && findProduct(item.product_id).quantity > 0)
        .map(item => ({
            product_id: item.product_id,
            quantity: Math.min(item.quantity, findProduct(item.product_id).quantity)
        }));

    saveCart(cart);
}

const renderCart = () => {
    const cart = getCart();

    cartRows.innerHTML = '';

    let totalPaise = 0;
    let itemCount = 0;

    if(cart.length === 0){
        const tr = document.createElement('tr');
        const td = cell('Cart is empty');
        td.colSpan = 6;
        td.className = 'empty';
        tr.appendChild(td);
        cartRows.appendChild(tr);
    }

    cart.forEach((item, index) => {
        const product = findProduct(item.product_id);
        const subtotal = toPaise(product.price) * item.quantity;

        totalPaise += subtotal;
        itemCount += item.quantity;

        const tr = document.createElement('tr');

        tr.appendChild(cell(index + 1));
        tr.appendChild(cell(product.product_name));
        tr.appendChild(cell(Number(product.price).toFixed(2)));

        const qtyTd = document.createElement('td');
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.min = 1;
        qtyInput.max = product.quantity;
        qtyInput.step = 1;
        qtyInput.value = item.quantity;
        qtyInput.addEventListener('change', () => updateQuantity(product, qtyInput.value));
        qtyTd.appendChild(qtyInput);
        tr.appendChild(qtyTd);

        tr.appendChild(cell(formatRupees(subtotal)));

        const actionTd = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.className = 'delete';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeItem(product.product_id));
        actionTd.appendChild(removeBtn);
        tr.appendChild(actionTd);

        cartRows.appendChild(tr);
    });

    document.getElementById('item-count').textContent = itemCount;
    document.getElementById('cart-count').textContent = itemCount;
    document.getElementById('total-amount').textContent = `₹${formatRupees(totalPaise)}`;
    generateBtn.disabled = cart.length === 0;
}

const updateQuantity = (product, value) => {
    const quantity = Number(value);
    const cart = getCart();
    const item = cart.find(i => i.product_id === product.product_id);

    if(!Number.isInteger(quantity) || quantity < 1){
        showMsg('Quantity must be at least 1', 'error');
    } else if(quantity > product.quantity){
        showMsg(`Only ${product.quantity} ${product.product_name} in stock`, 'error');
        item.quantity = product.quantity;
    } else {
        item.quantity = quantity;
    }

    saveCart(cart);
    renderCart();
}

const removeItem = (product_id) => {
    saveCart(getCart().filter(item => item.product_id !== product_id));
    renderCart();
}

document.getElementById('add-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = searchInput.value.trim().toLowerCase();
    const quantity = Number(quantityInput.value);
    const product = products.find(p => p.product_name.toLowerCase() === name);

    if(!product){
        showMsg('Select a product from the list', 'error');
        return;
    }

    if(!Number.isInteger(quantity) || quantity < 1){
        showMsg('Quantity must be at least 1', 'error');
        return;
    }

    const cart = getCart();
    const item = cart.find(i => i.product_id === product.product_id);
    const newQuantity = (item ? item.quantity : 0) + quantity;

    if(newQuantity > product.quantity){
        showMsg(`Only ${product.quantity} ${product.product_name} in stock`, 'error');
        return;
    }

    if(item){
        item.quantity = newQuantity;
    } else {
        cart.push({ product_id: product.product_id, quantity });
    }

    saveCart(cart);
    renderCart();

    searchInput.value = '';
    quantityInput.value = 1;
    showMsg(`${product.product_name} added to cart`, 'success');
})

document.getElementById('clear-cart').addEventListener('click', () => {
    saveCart([]);
    renderCart();
    msg.className = 'msg';
})

generateBtn.addEventListener('click', async () => {
    const cart = getCart();

    if(cart.length === 0){
        showMsg('Cart is empty', 'error');
        return;
    }

    generateBtn.disabled = true;

    try{
        const res = await fetch('/api/bills',{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                payment_method: document.getElementById('payment-method').value
            })
        });

        const data = await res.json();

        if(!res.ok){
            showMsg(data.msg, 'error');
            await loadProducts();
            return;
        }

        saveCart([]);
        showMsg(`${data.msg}! Bill No: ${data.bill_number} | Total: ₹${data.total_amount}`, 'success');
        await loadProducts();

    } catch(err){
        showMsg('Server not reachable', 'error');
        generateBtn.disabled = false;
    }
})

const loadProducts = async () => {
    try{
        const res = await fetch('/api/products');
        const data = await res.json();

        if(!res.ok){
            showMsg(data.msg, 'error');
            return;
        }

        products = data.products;

        productOptions.innerHTML = '';
        for(const product of products.filter(p => p.quantity > 0)){
            const option = document.createElement('option');
            option.value = product.product_name;
            productOptions.appendChild(option);
        }

        cleanCart();
        renderCart();

    } catch(err){
        showMsg('Server not reachable', 'error')
    }
}

loadProducts();
