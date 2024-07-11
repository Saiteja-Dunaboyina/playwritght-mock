const { test,expect } = require('@playwright/test')
require('dotenv').config();
const bookingdata = require('../data/bookingdetails.json')
const statusCode = require('../data/statuscodes.json')

var token, id;

test("Enter username and password generate the token", async({ request }) => {
    const response = await request.post(`${process.env.baseUrl}/auth`, {
        data : {
            username : process.env.user,
            password : process.env.password,
        },
    })
    const responseBody = await response.json()
    token = await responseBody.token;
    console.log(await token)
    expect(response.status()).toBe(statusCode.success)
});

test("Posting the booking details", async ({ request }) => {
    const response = await request.post(`${process.env.baseUrl}/booking`, {
      data: bookingdata,
    });
    expect(response.status()).toBe(statusCode.success);
    expect(response.ok()).toBeTruthy();
    const responseBody = await response.json();
    console.log(responseBody.bookingid);
    id = responseBody.bookingid;
    expect(responseBody.booking).toHaveProperty("firstname", bookingdata.firstname);
    expect(responseBody.booking).toHaveProperty("lastname", bookingdata.lastname);
    expect(responseBody.booking).toHaveProperty("totalprice", bookingdata.totalprice);
    expect(responseBody.booking).toHaveProperty("depositpaid", bookingdata.depositpaid);
});

test("Getting all the booking ids" , async ({ page }) => {
    await page.route(`**/booking`, async route => {
        const json = [{"bookingid": 1, "firstname": "John", "lastname": "Doe"},
            {"bookingid": 2, "firstname": "Jane", "lastname": "Smith"},
            {"bookingid": 3, "firstname": "John Doe"}
        ]
        await route.fulfill({ json })
    })

    await page.goto(`${process.env.baseUrl}/booking`);
    const data = await page.textContent('body')
    const jsonData = JSON.parse(data)
    console.log(jsonData)
})

test("Create a booking" , async ({ page }) => {
    await page.route(`**/booking`, async route => {
        const json = { "bookingid" : 100, "firstname" : "Harry", "lastname" : "potter", "totalprice" : 111,
        "depositpaid" : true,
        "bookingdates" : {
            "checkin" : "2018-01-01",
            "checkout" : "2019-01-01"
        },
        "additionalneeds" : "Breakfast"}
        await route.fulfill({ json })
    })

    await page.goto(`${process.env.baseUrl}/booking`)
    const data = await page.textContent('body')
    const jsonData = JSON.parse(data)
    console.log(jsonData)
    expect(jsonData.firstname).toBe("Harry");
    expect(jsonData.lastname).toBe("potter");
})

test("Update the booking data based on booking id", async ({ page }) => {
    await page.route(`**/booking/${id}` , async route => {
        const json = { "bookingid" : id , "firstname" : "James", "lastname" : "Bond", "totalprice" : 111,
        "depositpaid" : true,
        "bookingdates" : {
            "checkin" : "2018-01-01",
            "checkout" : "2019-01-01"
        },
        "additionalneeds" : "Breakfast"}
        await route.fulfill({ 
            status : 200,
            json })
    })

    await page.goto(`${process.env.baseUrl}/booking/${id}`);
    const data = await page.textContent('body')
    const jsonData = JSON.parse(data)
    console.log(jsonData);
    expect(jsonData.firstname).toBe("James");
    expect(jsonData.lastname).toBe("Bond");
    expect(jsonData.bookingid).toBe(id);
})

test("Update partial booking data", async ({ page }) => {
    await page.route(`**/booking/${id}`, async route => {
        const json = { "firstname" : "Ghost", "lastname" : "Rider"}
        await route.fulfill({ json })
    })

    await page.goto(`${process.env.baseUrl}/booking/${id}`);
    const data = await page.textContent('body');
    const jsonData = JSON.parse(data);
    expect(jsonData.firstname).toBe("Ghost")
    expect(jsonData.lastname).toBe("Rider")
})

test("Delete booking data with booking id", async ({ page }) => {
    await page.route(`**/booking/${id}`, async route => {
        const json = { "message" : "Booking data is deleted successfully"}
        await route.fulfill({ json }) 
    })

    await page.goto(`${process.env.baseUrl}/booking/${id}`);
    const data = await page.textContent('body');
    const jsonData = JSON.parse(data)
    expect(jsonData.message).toBe("Booking data is deleted successfully");
})


