const axios = require('axios');

const testMediaAPI = async () => {
  try {
    console.log('Testing Mobile Media API...');
    
    const response = await axios.get('http://localhost:3000/api/mobile/media');
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.length > 0) {
      const firstItem = response.data.data[0];
      console.log('\nFirst media item:');
      console.log('Speaker:', firstItem.speaker || 'NOT PROVIDED');
      console.log('Thumbnail:', firstItem.thumbnail || 'NOT PROVIDED');
      console.log('Type:', firstItem.type);
      console.log('Title:', firstItem.title);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testMediaAPI();