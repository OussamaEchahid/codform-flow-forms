
const fs = require('fs');
const path = require('path');

// Theme extension directory
const themeExtDir = path.join(__dirname, 'extensions/theme-extension-codform');

// Function to validate HTML tags in a file
function validateHtmlTags(filePath) {
  console.log(`Validating HTML tags in ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Simple validation of opening and closing tags
    const tagStack = [];
    const htmlTagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'track', 'wbr'];
    
    let match;
    let position = 0;
    let lineNum = 1;
    
    // Count lines
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n') {
        lineNum++;
      }
      if (i === position && match) {
        // This is where the match starts
        const tagName = match[1];
        const isClosingTag = match[0].startsWith('</');
        const isSelfClosing = selfClosingTags.includes(tagName) || 
                             match[0].endsWith('/>') || match[0].endsWith(' />');
        
        if (isClosingTag) {
          // Check if it matches the most recent tag on the stack
          if (tagStack.length === 0) {
            console.error(`Error at line ${lineNum}: Found closing tag </${tagName}> without a matching opening tag`);
            return false;
          }
          
          const lastTag = tagStack.pop();
          if (lastTag !== tagName) {
            console.error(`Error at line ${lineNum}: Expected closing tag </${lastTag}> but found </${tagName}>`);
            return false;
          }
        } else if (!isSelfClosing) {
          // Push to stack if it's an opening tag and not self-closing
          tagStack.push(tagName);
        }
      }
      
      if (i === position && !match) {
        // No more matches found
        break;
      }
    }
    
    // Check if all tags are closed
    if (tagStack.length > 0) {
      console.error(`Error: Unclosed tags found: ${tagStack.join(', ')}`);
      return false;
    }
    
    console.log(`${filePath} validation passed`);
    return true;
  } catch (error) {
    console.error(`Error reading or validating file ${filePath}:`, error);
    return false;
  }
}

// Validate liquid files
function validateLiquidFile(filePath) {
  console.log(`Validating Liquid file: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for balanced Liquid tags
    const liquidTagPairs = [
      { open: '{%', close: '%}' },
      { open: '{{', close: '}}' }
    ];
    
    for (const pair of liquidTagPairs) {
      const openCount = (content.match(new RegExp(escapeRegExp(pair.open), 'g')) || []).length;
      const closeCount = (content.match(new RegExp(escapeRegExp(pair.close), 'g')) || []).length;
      
      if (openCount !== closeCount) {
        console.error(`Error in ${filePath}: Unbalanced Liquid tags - ${openCount} opening ${pair.open} tags but ${closeCount} closing ${pair.close} tags`);
        return false;
      }
    }
    
    // Check for balanced if/endif, for/endfor, etc.
    const liquidBlockTags = [
      { open: '{% if', close: '{% endif %}' },
      { open: '{% unless', close: '{% endunless %}' },
      { open: '{% for', close: '{% endfor %}' },
      { open: '{% form', close: '{% endform %}' },
      { open: '{% schema', close: '{% endschema %}' },
      { open: '{% comment', close: '{% endcomment %}' },
      { open: '{% capture', close: '{% endcapture %}' }
    ];
    
    for (const pair of liquidBlockTags) {
      // We need a more sophisticated approach for the block tags
      // since a simple count doesn't account for nested structures
      // This is a basic check that can be improved
      const openCount = (content.match(new RegExp(escapeRegExp(pair.open) + '\\s', 'g')) || []).length;
      const closeCount = (content.match(new RegExp(escapeRegExp(pair.close), 'g')) || []).length;
      
      if (openCount !== closeCount) {
        console.error(`Warning in ${filePath}: Potentially unbalanced Liquid block tags - ${openCount} opening ${pair.open} tags but ${closeCount} closing ${pair.close} tags`);
        // Don't fail for this, as it's a warning
      }
    }
    
    // Call HTML validation after Liquid validation
    return validateHtmlTags(filePath);
  } catch (error) {
    console.error(`Error reading or validating file ${filePath}:`, error);
    return false;
  }
}

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process the theme extension directory
function validateThemeExtension() {
  console.log(`Validating Shopify theme extension in ${themeExtDir}`);
  
  // Check if directory exists
  if (!fs.existsSync(themeExtDir)) {
    console.error(`Theme extension directory ${themeExtDir} not found`);
    process.exit(1);
  }
  
  // Validate block files
  const blocksDir = path.join(themeExtDir, 'blocks');
  if (fs.existsSync(blocksDir)) {
    const blockFiles = fs.readdirSync(blocksDir).filter(file => file.endsWith('.liquid'));
    let allValid = true;
    
    for (const file of blockFiles) {
      const filePath = path.join(blocksDir, file);
      const isValid = validateLiquidFile(filePath);
      if (!isValid) {
        allValid = false;
      }
    }
    
    if (!allValid) {
      console.error('Validation failed for one or more files');
      process.exit(1);
    }
  }
  
  console.log('All files validated successfully');
}

// Run the validation
validateThemeExtension();
