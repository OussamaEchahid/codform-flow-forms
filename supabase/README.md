# CODFORM - نماذج الدفع عند الاستلام

## Project info

**URL**: https://lovable.dev/projects/bdd609f7-47cd-46ca-b52a-70c677d421c9
**Shopify App URL**: https://codform-flow-forms.lovable.app/

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/bdd609f7-47cd-46ca-b52a-70c677d421c9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Shopify App Framework
- Remix

## Shopify Integration

This project includes Shopify integration for creating Cash on Delivery (COD) forms that can be embedded in Shopify stores.

### Running the Shopify App

To run the Shopify app locally:

```sh
# Install dependencies
npm install

# Start the Shopify app development server
npm run shopify:dev
```

### Deploying to Shopify

To deploy the app to Shopify:

```sh
# Build the app
npm run shopify:build

# Deploy the app
npm run shopify:deploy
```

### Shopify Extensions

This project includes the following Shopify extensions:

1. **Theme Extension**: Adds a COD form block that can be added to product pages
2. **Admin Action Extension**: Adds a button to the product details page in the Shopify admin to configure COD forms

### Connecting to a Shopify Store

1. Go to the Shopify Partners dashboard
2. Create a new app or use the existing app
3. Set the app URL to your deployed app URL
4. Set the redirect URL to `<your-app-url>/auth/callback`
5. Install the app in your Shopify store

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/bdd609f7-47cd-46ca-b52a-70c677d421c9) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
