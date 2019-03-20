//this file is to work with the Login.html PAGE portion of authentication


console.log("Initiallizing Firebase...");

// Initialize Firebase
let config = {
    apiKey: "AIzaSyAPITJ_b82lngDCMBkqOP4sf28fogy_QMc",
    authDomain: "inventorymanagementsoftware-gp.firebaseapp.com",
    databaseURL: "https://inventorymanagementsoftware-gp.firebaseio.com/",
    projectId: "inventorymanagementsoftware-gp",
    storageBucket: "inventorymanagementsoftware-gp.appspot.com",
    messagingSenderId: "451262431109"
};

let initialize = firebase.initializeApp(config);
let database = firebase.database();

let user_email;
let today;
let totalAmount;
let itemfound = false;
let uniqueKey_Array=[];
console.log('itemfound: ' + itemfound);

// RealTime listener
//this checks to see if user is logged in 
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        //User is logged in, redirect to profile page
        console.log("Already Signed in...");
        user_email = user.email;
        console.log("user_email: " + user_email);
        console.log("user: " + user.uid);
    }
    else {
        //user is not logged in, do nothing
        console.log('Not logged in...');
        window.location.href = "../login.html";
    }
});

//submit form

const dbRefObject = firebase.database().ref().child('databases'); //children of database object
const dbRefElement = dbRefObject.child('new_Entry'); //children of database object
const dbRefInventory = dbRefObject.child('Inventorydatabase'); //children of database object

//submit form

$(document).ready(function () {

    get_currentDate();

    //get the date of current day

    function get_currentDate() {
        today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        seconds = today.getTime();

        if (dd < 10) {
            dd = '0' + dd
        }

        if (mm < 10) {
            mm = '0' + mm
        }

        today = yyyy + '-' + mm + '-' + dd;
    }

    console.log("today: " + today);
    console.log("seconds: " + seconds);

    //This code here is for the event when filter icon is clicked.

    //after the filter icon being clicked, a function will be triggered where the system will look for the item code in the database return the item name and unit of measurement and fill in the respected fields

    $("#filter_itemCode").click(function () {
        console.log("Filter item code button has been clicked!");

        let searched_itemcode = $("#itemCode").val();

        //searching for item in database

        let response = database.ref('databases/InventoryDatabase').once('value');

        response.then(function (snapshot) {

            let fetchedData = snapshot.val();

            //loop through and parse the data to check if the item code is present in the database
            for (let uniqueKey in fetchedData) {

                let itemCode_filtered = fetchedData[uniqueKey]['itemCode'];
                let itemName_filtered = fetchedData[uniqueKey]['itemName'];
                let uom_filtered = fetchedData[uniqueKey]['uom'];
                let quantity_filtered = fetchedData[uniqueKey]['quantity'];

                if (itemCode_filtered == searched_itemcode) {
                    console.log('Found the item code you were looking for: ' + itemCode_filtered + ', ' + itemName_filtered + ', ' + uom_filtered);

                    //item code matched, now append the other information in the input text fields

                    $('#itemName').val(itemName_filtered);
                    $('#uom').val(uom_filtered);
                    $('#quantity').val(quantity_filtered);

                }
            }
        });
    });


    //on clicking the submit delivery item button
    // Form Submission

    $("#form_delivery").submit(function (config) {

        let itemCode = $("#itemCode").val();
        let itemName = $("#itemName").val();
        let uom = $("#uom").val();
        let quantity = $("#quantity").val();
        let destination = $('#destination').val();
        let issueDate = $("#issueDate").val();

        $(this), console.log("Submit to Firebase");

        //adding data instead of replacing with the new value

        // let newElement_newEntry = dbRefElement.push().setValue(itemCode);

        // Saving the user input into JSON format
        //FOR INVENTORY DATABASE
        let update_data_inventory = {
            'itemCode': itemCode,
            'itemName': itemName,
            'uom': uom,
            'quantity': quantity
        };

        //FOR DELIVERY LOG
        let update_data_delivery_log =
        {
            'itemCode': itemCode,
            'itemName': itemName,
            'uom': uom,
            'quantity': quantity,
            'destination': destination,
            // 'unitRate': unitRate,
            // 'totalAmount': totalAmount,
            // 'mainContract': mainContract,
            // 'mainVendor': mainVendor,
            // 'novatedContract': novatedContract,
            // 'novatedVendor': novatedVendor,
            // 'PRnum': PRnum,
            // 'POnum': POnum,
            // 'delChalNum': delChalNum,
            'issueDate': issueDate,
            'user_email': user_email,
            'current_date': today
        };

        // //check to see if the data is present in the inventory
        //READING FROM FIREBASE DATABASE

        //SECTION1

        let update_newEntry_log = database.ref('databases/delivery_log').push(update_data_delivery_log);

        let response = database.ref('databases/InventoryDatabase').once('value');

        response.then(function (snapshot) {

            console.log('itemfound: ' + itemfound);

            let fetchedData = snapshot.val();

            //loop through and parse the data then create TR in the table with this data
            for (let uniqueKey in fetchedData) {

                let itemCode_fetched = fetchedData[uniqueKey]['itemCode'];
                let existingQuantity = fetchedData[uniqueKey]['quantity'];

                if (itemCode_fetched == itemCode) {

                    //THIS MEANS ITEM EXISTS IN DATABASE SO JUST INCREMENT IT BY QUANTITY
                    let newQuantity = parseInt(existingQuantity) - parseInt(quantity);

                    console.log("New Updated Quantity: " + newQuantity);

                    let data = {
                        'quantity': newQuantity
                    }

                    itemfound = true;

                    let updating_inventory = database.ref('databases/InventoryDatabase/' + uniqueKey).update(data).then(function () {
                        alert('Data updated Successfully!');
                        console.log('itemfound: ' + itemfound);
                        location.reload();
                        return false;

                    });
                }
            }

            if (itemfound == false) {
                // else{

                // THIS MEANS ITEM DOES NOT EXIST IN DATASBE SO JUST SET IT TO A NEW ITEM WITH QUANTITY

                // pushing the inventory data

                // let pushing_inventory = database.ref('databases/InventoryDatabase/').push(update_data_inventory).then(function(){
                alert('Could not find the item in the inventory! Please check if the item code is correct.');
                // location.reload();
                return false;
                // });              
            }
        });
        itemfound = false;
    });

    //FETCH DATA FROM THE DATABASE AND INITIALIZE EVERYTHING IN OUR PAGE

    //READING FROM FIREBASE DATABASE
    database.ref('databases/delivery_log').once('value').then(function(snapshot){

        let fetchedData = snapshot.val();
        console.log(fetchedData);

        //Code in order to show the last entry first (LAST IN FIRST OUT)

        //loop through unique keys and create an array in order to view get all the unique keys
        let uniqueKeyArray_index=0;
        for (let uniqueKey in fetchedData){
            uniqueKey_Array[uniqueKeyArray_index] =  uniqueKey;
            uniqueKeyArray_index++;
        }

        console.log('uniqueKey_Array: '+uniqueKey_Array);

        //from the unique key array, reverse it and set each variable so that the fetched data from that unique key can be found

        for (let reversed_uniqueKey_index=uniqueKey_Array.length-1; reversed_uniqueKey_index>=0; reversed_uniqueKey_index--){
            let reversed_uniqueKey = uniqueKey_Array[reversed_uniqueKey_index];

        //loop through and parse the data then create TR in the table with this data
        // for (let uniqueKey in fetchedData){

            //reversing the key value in the database so that the last entry shows up first
            let itemCode = fetchedData[reversed_uniqueKey]['itemCode'];
            let itemName = fetchedData[reversed_uniqueKey]['itemName'];
            let uom = fetchedData[reversed_uniqueKey]['uom'];
            let quantity = fetchedData[reversed_uniqueKey]['quantity'];
            let destination = fetchedData[reversed_uniqueKey]['destination'];
            // let unitRate = fetchedData[reversed_uniqueKey]['unitRate'];
            // let totalAmount = fetchedData[reversed_uniqueKey]['totalAmount'];
            // let mainContract = fetchedData[reversed_uniqueKey]['mainContract'];
            // let mainVendor = fetchedData[reversed_uniqueKey]['mainVendor'];
            // let novatedContract = fetchedData[reversed_uniqueKey]['novatedContract'];
            // let novatedVendor = fetchedData[reversed_uniqueKey]['novatedVendor'];
            // let PRnum = fetchedData[reversed_uniqueKey]['PRnum'];
            // let POnum = fetchedData[reversed_uniqueKey]['POnum'];
            // let delChalNum = fetchedData[reversed_uniqueKey]['delChalNum'];
            let issueDate = fetchedData[reversed_uniqueKey]['issueDate'];
            let user_email = fetchedData[reversed_uniqueKey]['user_email'];
            let current_date = fetchedData[reversed_uniqueKey]['current_date'];

            // appending elements into the databaseTable
            $('.delivery_log_table').append(/*html*/`
                <tr data-key="${reversed_uniqueKey}">
                    <td>
                        ${itemCode}
                    </td>
                    <td>
                        ${itemName}
                    </td>
                    <td>
                        ${uom}
                    </td>
                    <td>
                        ${quantity}
                    </td>
                    <td>
                        ${destination}
                    </td>
                    <td>
                        ${issueDate}
                    </td>
                    <td>
                        ${user_email}
                    </td>
                    <td>
                        ${current_date}
                    </td>
                </tr>
            `);
        }
    });

});
