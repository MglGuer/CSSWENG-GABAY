# Coding Standards
For Project Structure, HTML, CSS, JavaScript, and UML Diagrams.

## Project Structure

Our project follows the Model-View-Controller (MVC) architecture to ensure organized and scalable code. Below is a breakdown of the project structure:

- **model**: This directory contains all the database schemas and data-related logic.
- **views**: Here, you will find the Handlebars (HBS) templates and layouts for rendering pages.
- **public**: This folder houses all the static files such as CSS, JavaScript, images, and fonts.
- **app**: This is where the application routes and Node.js modules (controllers) reside.
- **package-lock.json**: This file manages project dependencies and ensures consistent installations across different environments.

## HTML Standards

Adhere to HTML5 standards, use non-semantic HTML tags.

- **Attributes**: Always use double quotes for attribute values.
	```html
	<input type="text" name="username">
	```
- **Formatting**: Ensure proper nesting and closure of all tags to maintain a valid HTML structure.
- **Accessing**: Each HTML file can be accessed via 'href' and should be connected through the appropriate routing mechanisms.

## CSS Standards

Follows a structured approach to maintain readability and consistency.

- **Syntax**: Use `kebab-case` for naming classes and IDs, and always end declarations with a semicolon.
  ```css
  .main-header {
      background-color: #333;
  }
- **Formatting**: place a space after each class or ID selector, only one attribute declaration per line for better readability.
	```css
	.main-header {
	    background-color: #333;
	    color: #fff;
	}
	```
- **Organization**: Use comments to separate different sections and provide explanations where necessary.
	```css
	/* Header styles */
	.main-header {
	    background-color: #333;
	}

	/* Footer styles */
	.main-footer {
	    background-color: #222;
	}
	```

## JavaScript Standards
Ensure code is maintainable and efficient.
- **Location**: All JavaScript files for the front-end should be located in the public directory. Avoid using inline JavaScript in HTML files.
- **Syntax**: 
  - Use `camelCase` for variable and function names.
	```javascript
	let userName = 'user';
	function getUserData() {
	    // some code
	}
	```
  - Server methods for GET and POST requests should be in ```kebab-case```.
	```javascript
	server.get('/patient-data', (req, res) => {
	    // some code
	});
	server.post('/update-patient', (req, res) => {
	    // some code
	});
	```
- **Formatting:**
  - Use ```try-catch``` blocks for error handling in server methods to ensure stability.
	  ```javascript
	  server.post('/update-user', (req, res) => {
		    try {
		        // method code
		    } catch (error) {
		        // handle error
		    }
		});
	  ```
  - Place a space after each section for readability and organization.
- **Organization**: Use comments to break down and describe different sections of your code. This will help in maintaining and understanding the codebase.

## UML Diagrams

Render UML diagrams using [LucidChart](https://lucid.app/lucidchart). 
 - [Diagram for Database Structure](https://lucid.app/lucidchart/32688fbc-86bc-4805-9b56-ae113d6f2efd/edit?viewport_loc=-686,696,2560,1184,0_0&invitationId=inv_468e25cb-53b4-4ccd-a970-167019d483b9)
 - [Diagram for MVC](https://lucid.app/lucidchart/ce27503c-51ce-48fb-993f-3be174b39d60/edit?viewport_loc=315,-1172,6287,3800,0_0&invitationId=inv_fce8d2be-9d10-4fcd-8b69-106c9d352570)