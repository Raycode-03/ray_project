const form = document.querySelector("#form");
const messageBox = document.getElementById("newsletter_message");
let sub_btn=document.querySelector('#form button');
form.addEventListener("submit", subscribe_user);
async function subscribe_user(e){
    e.preventDefault();
    let email=document.querySelector('.new_input').value;
    const user_email=email
    const csrfToken=sub_btn.dataset.csrf
    sub_btn.textContent = 'Subscribing...';
    sub_btn.disabled = true;
    messageBox.textContent = ''; // Clear previous message
    try{
        const res= await fetch('/kongahub/subscribe' ,{
        method:"POST",
        body:JSON.stringify({
            email:user_email,
            _csrf: csrfToken
        }),
        headers:{
            "Content-Type":"application/json"
        }
        
        });
        
        const resdata = await res.json();
        
      if (res.ok) {
        messageBox.style.color = "green";
        messageBox.textContent = resdata.message || "You have successfully subscribed!";
        form.reset();
      } else {
        messageBox.style.color = "red";
        messageBox.textContent = resdata.message || "You are already subscribed!";
      }

    } catch (err) {
      messageBox.style.color = "red";
      messageBox.textContent = "Something went wrong. Please try again.";
      console.error(err);
    }
     finally {
        // Revert button state after the request is finished
        sub_btn.textContent = 'Subscribe';
        sub_btn.disabled = false;
    }
        
}