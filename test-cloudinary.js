const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dxcq3h1fe',
    api_key: '429414767758623',
    api_secret: '5i89eE_44jqIrjPnTFcJ0e0h0vM',
});

cloudinary.uploader.upload('dummy.jpg', { folder: 'sandhya-furnishing' })
    .then(result => console.log('Upload OK:', result.secure_url))
    .catch(err => console.error('Upload Error:', err));
