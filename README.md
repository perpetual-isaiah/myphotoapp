
# Vibe Cam

## Description
Vibe Cam is a mobile photo gallery app built with React Native and Expo. It allows users to capture, organize, and edit photos with ease. Users can create albums, add captions, favorite photos, apply filters like black & white, and perform edits such as rotate and crop. All data is stored locally for offline access.

## Tech Stack
- Frontend:React Native with Expo
- Storage: AsyncStorage, Expo FileSystem
- Image Editing: Expo Image Manipulator
- Navigation: Expo Router
- Media Access: Expo Camera, Expo Media Library

## Features
- 📸 Capture photos using device camera  
- 🖼️ View photos in a scrollable grid  
- 🏷️ Add captions to photos  
- ❤️ Favorite/unfavorite photos  
- 🗂️ Create and manage photo albums  
- 🔄 Rotate and ✂️ crop photos  
- 🎨 Apply black & white filter  
- ✅ Save all edits locally  
- 📁 Local-only offline data storage  

## Installation & Setup

1. Clone the repository:
   bash
   git clone https://github.com/perpetual-isaiah/myphotoapp.git
   cd MyPhotoApp


2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Expo development server:

   ```bash
   npx expo start
   ```

> 💡 Make sure you have the **Expo Go app** installed on your phone to preview the app.

## Screenshots



| Album View                             | Editing Screen                         | Main Screen                              |
| ![screenshot1](https://github.com/user-attachments/assets/24413979-d1be-4abc-a66a-a3d2e73493c6) | [screenshot3](https://github.com/user-attachments/assets/c0a32128-cdbb-4a29-9fa6-c1f05a4a14d6) |![screenshot2](https://github.com/user-attachments/assets/a8098088-0882-46ba-8394-8ef69ae1882c)
 |




## API Documentation

No external API is currently used. All data and image handling are done locally on the device. Future versions may include cloud sync support and API documentation via Postman.

## Live Demo

No live version is deployed. The app runs locally on devices through the **Expo Go** environment.

## Contributing

1. Fork this repository
2. Create a new branch:

   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:

   ```bash
   git commit -m 'Add new feature'
   ```
4. Push to your branch:

   ```bash
   git push origin feature-name
   ```
5. Open a Pull Request

## License

This project is licensed under the MIT License.

