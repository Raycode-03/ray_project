// forms=document.querySelectorAll('#form').forEach(form=>{


// form.addEventListener('submit',async function (e){
//     e.preventDefault()
    
//     await fetch('/check_session',{
//         method:'GET',
//         credentials:'include',
//     })
//     .then(res=>res.json())
//     .then(data=>{
//         if(data.valid){
//             e.target.submit()
//         }   
//         else{
//             alert('Your session has expired')
//             window.location.href='/login'
//         }
//     })  
//     .catch(err=>{
//         alert(`an error occured while checking your session,${err}`)
//         console.log(err)
//         window.location.href='/login'
//     })
// })
// })