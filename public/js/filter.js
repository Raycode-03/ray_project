let filterbtn_open=document.querySelector('.filter_dropdown');
let dropdown_menu_filter=document.querySelector('.dropdown_menu_filter');
dropdown_menu_filter.style.display='none';
let filtercount=0;
// to make it display when clicked
filterbtn_open.onclick=function(){
    if(filtercount==0){
        dropdown_menu_filter.style.display='block';
        filtercount=1
    } else if(filtercount==1){dropdown_menu_filter.style.display='none';filtercount=0}  
// to call all the varibales needed
let filter_btn=document.querySelector('#filterbtn').onclick=function rate_filter(){
   
    let filter_price_min=parseFloat(document.querySelector('#filterpricemin').value)||0
    let filter_price_max=parseFloat(document.querySelector('#filterpricemax').value)||0


        document.querySelectorAll('.product_list').forEach(item => {
                let prices=parseFloat(item.querySelector('.item_price').textContent)
                      
                if(filter_price_min<=prices && filter_price_max>=prices) {
                
                    item.style.display = '';
                } else{
                    item.style.display = 'none';
                }
                
            });
               
        
}
}


    const page_type=document.querySelector('.page_name').value
    const item_btn=document.querySelectorAll('.box');
    const  csrfToken=document.querySelector('._csrf').value

        item_btn.forEach(btn=>{
            btn.addEventListener('click',async(e)=>{
                
                e.preventDefault();
                const filteritem =e.target.textContent.toLowerCase();
                
                try {
                    const res = await fetch(`/kongahub/${page_type}/filter?filteritem=${filteritem}`)
                    if (!res.ok) {
                      throw new Error('Something went wrong!');
                    }
                    
                    
                    const products=await res.json();
                  
                    
                    let grid_products=document.querySelector('#product_grid');
                    grid_products.innerHTML='';
                    
        

products.forEach(product => {
     // Create a new product list item
     const productListItem = document.createElement('li');
     productListItem.className = 'product_list';
    //  article
     const productElement = document.createElement('article');
     productElement.className = 'product_item';   
                  
    // Create the link to the product details page
    const aTag = document.createElement('a');
    aTag.href = `/kongahub/${page_type}/details/${product._id}`;

    // Create the product image
    const image = document.createElement('img');
    image.src = product.image_path;
    image.alt = product.title;
    aTag.appendChild(image);

    // Create the product content container
    const productContent = document.createElement('div');
    productContent.className = 'product_content';

    // Create the product title
    const title = document.createElement('h2');
    title.textContent = product.title;
    productContent.appendChild(title);

    // Create the product price
    const price = document.createElement('h3');
    price.className = 'item_price';
    price.textContent = product.price;
    productContent.appendChild(price);

    // Append the product content to the link
    aTag.appendChild(productContent);

    // Append the link to the product element
    productElement.appendChild(aTag);

    // Create the product action container
    const productAction = document.createElement('div');
    productAction.className = 'product_action';

    // Create the form for adding to cart
    const form = document.createElement('form');
    form.action = `/kongahub/products/cart/${product._id}?_csrf=${csrfToken}`;
    form.method = 'post';

    // Create the quantity select dropdown
    const quantityDiv = document.createElement('div');
    quantityDiv.className = 'no';
    const quantitySelect = document.createElement('select');
    quantitySelect.name = 'amount';

    // Populate the quantity select options
    for (let i = 1; i <= 20; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        quantitySelect.appendChild(option);
    }

    quantityDiv.appendChild(quantitySelect);
    form.appendChild(quantityDiv);

    // Create the "Add to Cart" button
    const addToCartButton = document.createElement('button');
    addToCartButton.className = 'cart';
    addToCartButton.textContent = 'Cart';
    addToCartButton.dataset.csrf = csrfToken;
    form.appendChild(addToCartButton);

    // Append the form to the product action container
    productAction.appendChild(form);

    // Append the product action container to the product element
    productElement.appendChild(productAction);

     // Append the product element to the product list item
     productListItem.appendChild(productElement);

     // Append the product list item to the product grid
     grid_products.appendChild(productListItem);
});
                    
                  } catch (err) {
                    alert(err.message);
                  }
            })  
    })
    