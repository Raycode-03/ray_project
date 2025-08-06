const deleteproductelement = document.querySelectorAll('.order-actions form');
async function update_product(e) {
  e.preventDefault();
  const form = e.target;
  const formdata = new FormData(form);
  const newstatus = formdata.get('status');
  const orderid = formdata.get('order_id');
  const csrfToken = formdata.get('_csrf');
  console.log(newstatus )
  try {
    const res = await fetch('/admin/orders/'+orderid, {
      method: "PATCH",
      body: JSON.stringify({
        _csrf:csrfToken
        
      }),
      headers: {
        'Content-type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Something went wrong!');
    }

    const resdata = await res.json();
    form.parentElement.parentElement.querySelector('.badge').textContent = resdata.newstatus;
  } catch (err) {
    alert(err.message);
  }
}

deleteproductelement.forEach((deleteproduct)=>{
  deleteproduct.addEventListener('submit', update_product);
  })
