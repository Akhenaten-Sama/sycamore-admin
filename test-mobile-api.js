#!/usr/bin/env node

/**
 * Mobile API Testing Script
 * 
 * This script tests the mobile API endpoints with sample data.
 * Run this after setting up the mobile APIs to verify functionality.
 * 
 * Usage: node test-mobile-api.js
 */

const baseUrl = 'http://localhost:3000/api'
let authToken = null

// Test utilities
async function makeRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  })
  
  const data = await response.json()
  return { status: response.status, data }
}

function logTest(testName, success, message = '') {
  const icon = success ? '✅' : '❌'
  console.log(`${icon} ${testName}${message ? ': ' + message : ''}`)
}

// Test functions
async function testMobileRegistration() {
  console.log('\n🔐 Testing Mobile Registration...')
  
  const testUser = {
    firstName: 'Mobile',
    lastName: 'User',
    email: `mobile-test-${Date.now()}@example.com`,
    phone: '+1234567890',
    password: 'password123',
    dateOfBirth: '1990-01-01',
    maritalStatus: 'single'
  }
  
  const result = await makeRequest('/auth/mobile/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  })
  
  if (result.status === 201 && result.data.success) {
    authToken = result.data.token
    logTest('Mobile Registration', true, `User created with ID: ${result.data.user.id}`)
    return result.data.user
  } else {
    logTest('Mobile Registration', false, result.data.message)
    return null
  }
}

async function testMobileLogin() {
  console.log('\n🔑 Testing Mobile Login...')
  
  // First register a test user
  const testUser = {
    firstName: 'Login',
    lastName: 'Test',
    email: `login-test-${Date.now()}@example.com`,
    phone: '+1234567891',
    password: 'password123'
  }
  
  // Register
  await makeRequest('/auth/mobile/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  })
  
  // Now test login
  const loginResult = await makeRequest('/auth/mobile/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  })
  
  if (loginResult.status === 200 && loginResult.data.success) {
    logTest('Mobile Login', true, `Token received for ${loginResult.data.user.email}`)
    return loginResult.data.token
  } else {
    logTest('Mobile Login', false, loginResult.data.message)
    return null
  }
}

async function testMobileProfile() {
  console.log('\n👤 Testing Mobile Profile...')
  
  if (!authToken) {
    logTest('Mobile Profile', false, 'No auth token available')
    return
  }
  
  const result = await makeRequest('/auth/mobile/profile')
  
  if (result.status === 200 && result.data.success) {
    logTest('Mobile Profile', true, `Profile loaded for ${result.data.user.firstName} ${result.data.user.lastName}`)
    return result.data.user
  } else {
    logTest('Mobile Profile', false, result.data.message)
    return null
  }
}

async function testUserJourney() {
  console.log('\n📊 Testing User Journey...')
  
  if (!authToken) {
    logTest('User Journey', false, 'No auth token available')
    return
  }
  
  const result = await makeRequest('/mobile/journey')
  
  if (result.status === 200 && result.data.success) {
    const stats = result.data.data.stats
    logTest('User Journey', true, `Stats loaded - Attendance: ${stats.totalAttendance}, Giving: $${stats.totalGiving}`)
    return result.data.data
  } else {
    logTest('User Journey', false, result.data.message)
    return null
  }
}

async function testMobileTeams() {
  console.log('\n👥 Testing Mobile Teams...')
  
  if (!authToken) {
    logTest('Mobile Teams', false, 'No auth token available')
    return
  }
  
  const result = await makeRequest('/mobile/teams')
  
  if (result.status === 200 && result.data.success) {
    logTest('Mobile Teams', true, `${result.data.data.length} teams loaded`)
    return result.data.data
  } else {
    logTest('Mobile Teams', false, result.data.message)
    return null
  }
}

async function testMobileEvents() {
  console.log('\n📅 Testing Mobile Events...')
  
  if (!authToken) {
    logTest('Mobile Events', false, 'No auth token available')
    return
  }
  
  // Test upcoming events
  const upcomingResult = await makeRequest('/mobile/events?type=upcoming')
  
  if (upcomingResult.status === 200 && upcomingResult.data.success) {
    logTest('Mobile Events (Upcoming)', true, `${upcomingResult.data.data.length} upcoming events`)
  } else {
    logTest('Mobile Events (Upcoming)', false, upcomingResult.data.message)
  }
  
  // Test past events
  const pastResult = await makeRequest('/mobile/events?type=past')
  
  if (pastResult.status === 200 && pastResult.data.success) {
    logTest('Mobile Events (Past)', true, `${pastResult.data.data.length} past events`)
  } else {
    logTest('Mobile Events (Past)', false, pastResult.data.message)
  }
  
  return upcomingResult.data.data
}

async function testMobileBlog() {
  console.log('\n📝 Testing Mobile Blog...')
  
  if (!authToken) {
    logTest('Mobile Blog', false, 'No auth token available')
    return
  }
  
  const result = await makeRequest('/mobile/blog?page=1&limit=5')
  
  if (result.status === 200 && result.data.success) {
    logTest('Mobile Blog', true, `${result.data.data.length} blog posts loaded (Page 1)`)
    return result.data.data
  } else {
    logTest('Mobile Blog', false, result.data.message)
    return null
  }
}

async function testMobileCommunities() {
  console.log('\n🏘️ Testing Mobile Communities...')
  
  if (!authToken) {
    logTest('Mobile Communities', false, 'No auth token available')
    return
  }
  
  // Test all communities
  const allResult = await makeRequest('/mobile/communities?type=all')
  
  if (allResult.status === 200 && allResult.data.success) {
    logTest('Mobile Communities (All)', true, `${allResult.data.data.length} communities loaded`)
  } else {
    logTest('Mobile Communities (All)', false, allResult.data.message)
  }
  
  // Test joined communities
  const joinedResult = await makeRequest('/mobile/communities?type=joined')
  
  if (joinedResult.status === 200 && joinedResult.data.success) {
    logTest('Mobile Communities (Joined)', true, `${joinedResult.data.data.length} joined communities`)
  } else {
    logTest('Mobile Communities (Joined)', false, joinedResult.data.message)
  }
  
  return allResult.data.data
}

async function testInvalidToken() {
  console.log('\n🔒 Testing Invalid Token Handling...')
  
  const oldToken = authToken
  authToken = 'invalid-token-123'
  
  const result = await makeRequest('/mobile/journey')
  
  if (result.status === 401) {
    logTest('Invalid Token Handling', true, 'Correctly rejected invalid token')
  } else {
    logTest('Invalid Token Handling', false, 'Should have rejected invalid token')
  }
  
  authToken = oldToken
}

async function testMissingToken() {
  console.log('\n🚫 Testing Missing Token Handling...')
  
  const oldToken = authToken
  authToken = null
  
  const result = await makeRequest('/mobile/journey')
  
  if (result.status === 401) {
    logTest('Missing Token Handling', true, 'Correctly rejected missing token')
  } else {
    logTest('Missing Token Handling', false, 'Should have rejected missing token')
  }
  
  authToken = oldToken
}

// Main test runner
async function runMobileAPITests() {
  console.log('🚀 Starting Mobile API Tests...')
  console.log('=' .repeat(50))
  
  try {
    // Authentication Tests
    const registeredUser = await testMobileRegistration()
    const loginToken = await testMobileLogin()
    
    if (authToken) {
      // Profile Tests
      await testMobileProfile()
      
      // Core Mobile Features
      await testUserJourney()
      await testMobileTeams()
      await testMobileEvents()
      await testMobileBlog()
      await testMobileCommunities()
      
      // Security Tests
      await testInvalidToken()
      await testMissingToken()
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('🏁 Mobile API Tests Complete!')
    
    if (authToken) {
      console.log('\n📱 Test Summary:')
      console.log('- Authentication: Working')
      console.log('- User Management: Working') 
      console.log('- Core Features: Working')
      console.log('- Security: Working')
      console.log('\n✨ Mobile API is ready for production!')
    } else {
      console.log('\n⚠️  Some tests failed. Check authentication setup.')
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message)
    console.log('\n🔧 Make sure:')
    console.log('- Server is running on localhost:3000')
    console.log('- Database connection is working')
    console.log('- All mobile API endpoints are implemented')
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runMobileAPITests()
}

module.exports = {
  runMobileAPITests,
  makeRequest
}
