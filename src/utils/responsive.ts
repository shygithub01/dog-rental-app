// Responsive breakpoints
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1200px'
};

// Responsive styles helper
export const responsive = {
  // Mobile-first approach
  mobile: (styles: React.CSSProperties) => ({
    ...styles,
    '@media (min-width: 480px)': {
      display: 'none'
    }
  }),
  
  // Tablet and up
  tablet: (styles: React.CSSProperties) => ({
    ...styles,
    '@media (max-width: 767px)': {
      display: 'none'
    }
  }),
  
  // Desktop and up
  desktop: (styles: React.CSSProperties) => ({
    ...styles,
    '@media (max-width: 1023px)': {
      display: 'none'
    }
  })
};

// Common responsive styles
export const mobileStyles = {
  container: {
    padding: '10px',
    maxWidth: '100%'
  },
  header: {
    padding: '10px 15px',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  hero: {
    minHeight: '300px',
    padding: '20px 15px'
  },
  grid: {
    gridTemplateColumns: '1fr',
    gap: '15px'
  },
  card: {
    padding: '15px'
  },
  button: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem'
  }
};

export const tabletStyles = {
  container: {
    padding: '20px',
    maxWidth: '100%'
  },
  header: {
    padding: '15px 30px',
    flexDirection: 'row' as const,
    gap: '20px'
  },
  hero: {
    minHeight: '400px',
    padding: '40px 30px'
  },
  grid: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    padding: '25px'
  },
  button: {
    width: 'auto',
    padding: '10px 20px',
    fontSize: '1rem'
  }
};

export const desktopStyles = {
  container: {
    padding: '40px',
    maxWidth: '1200px'
  },
  header: {
    padding: '15px 40px',
    flexDirection: 'row' as const,
    gap: '20px'
  },
  hero: {
    minHeight: '500px',
    padding: '60px 40px'
  },
  grid: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '30px'
  },
  card: {
    padding: '30px'
  },
  button: {
    width: 'auto',
    padding: '12px 24px',
    fontSize: '1rem'
  }
}; 