// The purpose of this module is to test API core functionality.
    //It is broken down by API function. 
    //Dont forget to comment out sections that arn't being used to prevent unnessary API calls. 



// input: user location
// output: activities as object with key value pairs


// 1. activity function call 
        //Input:
        //Output:
    // Import the activityFun function from the activity module
    const { activityFun } = require('./api/activity');
    // Define an asynchronous function to run the test
    async function test() {
        // HARD-CODE TEST HERE: Specify the location
        const location = 'los angeles';

        // Call the activityFun function with the specified location
        try {
            const activities = await activityFun(location);
            console.log('Generated Activities:', activities);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    // Execute the test function
    test();

// // 2. spot function call
//     //Input: ${location} ${activityString}
//     //Output: suggested spots in the location that meet criteria.
//         // Import the spotFun function from the activity module
//         const { spotFun } = require('./api/spot');
//         // Define an asynchronous function to run the test
//         async function test() {
//             // HARD-CODE TEST HERE: Specify the activity
//             const activityString = 'indian food';
//             const location = 'charleston'; // using const twice in same document with same varible. Dont forget to comment out non-tested segment.
//             // Call the spotFun function with the specified location
//             try {
//                 const spots = await spotFun(location,activityString);
//                 console.log('Generated Spots:', spots);
//             } catch (error) {
//                 console.error('Error:', error);
//             }
//         }
//         // Execute the test function
//         test();
// // 3. Space reserved