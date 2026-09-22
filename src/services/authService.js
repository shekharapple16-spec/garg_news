import { supabase } from '../lib/supabase'

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const message = (error.message || '').toLowerCase()
    const isInvalidCredentials =
      message.includes('invalid login credentials') ||
      message.includes('invalid credentials') ||
      message.includes('email or password') ||
      message.includes('incorrect') ||
      message.includes('failed to sign in')

    throw new Error(isInvalidCredentials ? 'Invalid login credentials' : error.message || 'Unable to sign in. Please try again.')
  }

  return data
}

export async function signUpWithEmail({ email, password, username, mobile }) {
  const trimmedUsername = username?.trim()
  const trimmedMobile = mobile?.trim()

  if (!trimmedUsername) {
    throw new Error('Please enter your full name to create an admin account.')
  }

  if (!trimmedMobile) {
    throw new Error('Please enter your mobile number to create an admin account.')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: trimmedUsername,
        mobile: trimmedMobile,
      },
    },
  })

  if (error) {
    throw new Error(error.message || 'Unable to create your admin account right now.')
  }

  return data
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message || 'Unable to sign out at the moment.')
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(error.message || 'Unable to verify your session.')
  }

  return data.session
}
