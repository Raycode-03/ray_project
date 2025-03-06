cart_btn=document.querySelectorAll('.close');
async function delte_cart(e) {
    const btn=e.target
    const cartid=btn.dataset.id
    const csrfToken=btn.dataset.csrf
    const res=await fetch('/cart/' + cartid+ '?_csrf=' + csrfToken,{
        method:"DELETE"
    });
    if(!res.ok){
        alert('something went wrong !!')
        return
    }
    btn.parentElement.parentElement.remove()
}

for(let cart of cart_btn){
    cart.addEventListener('click', delte_cart)
}
