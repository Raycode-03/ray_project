const deleteproductelement=document.querySelectorAll('.product_item button');
async function delete_product(e){
    e.preventDefault();
    const btn=e.target;
    const productid=btn.dataset.id
    const csrfToken=btn.dataset.csrf
  const res= await fetch('/admin/products/delete/' + productid + '?_csrf='+ csrfToken,{
        method:"DELETE"
    });
    if(!res.ok){
        alert('something went wrong !!')
        return
    }
    btn.parentElement.parentElement.parentElement.parentElement.remove();
}


for( let deleteproduct of deleteproductelement){
    deleteproduct.addEventListener('click',delete_product);
}
