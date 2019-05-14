// Updates the tags of each question to include parent tags. Because the Set object seems to be
// available (at least in Chrome), duplicates are checked manually. The program is hard-coded
// to work with tags in specific columns, adjusting the spreadsheet will require inputRange
// and/or outputRange to be adjusted as well.
function updateTags() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Questions'); // sheet with tags, replace 'Questions' with name of sheet
  var inputRange = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1); // assumes input is in column C with header row
  var outputRange = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1); // assumes input is in column D with header row
  
  var allTags = inputRange.getDisplayValues();
  var root = generateTree(); // tree containing tag heirarchy
  var updatedTags = [];
  
  // for each question/row
  for (var i = 0; i < allTags.length; i++)
  {
    var tags = allTags[i][0].split(' '); // array containing each tag for given question
    var numTags = tags.length; // number of initial tags
    
    // for each tag for given question
    for (var j = 0; j < numTags; j++)
    {
      // gets all parents of each tag, adds non-duplicates to tag list
      var parentTags = getParentTags(tags[j], root);
      
      // pushes error message if no tags found (perhaps due to spelling error)
      if (parentTags.length == 0) {
        parentTags.push('NO_TAGS_FOUND');
      }
      else {
        for (var k = 0; k < parentTags.length; k++)
        {
          if (tags.indexOf(parentTags[k]) < 0){
            tags.push(parentTags[k]);
          }
        }
      }
    }
    updatedTags.push([tags.join(' ')]);
  }
  outputRange.setValues(updatedTags);
}

// Creates a quiz using questions which match specified tags.
function generateQuiz() {
  var searchTags = ['root'] // tags with which to match
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var inputSheet = spreadsheet.getSheetByName('Questions');
  var inputRows = inputSheet.getRange(2, 1, inputSheet.getLastRow() - 1, inputSheet.getLastColumn()).getValues();
  var form = FormApp.create(searchTags.join(' ') + ' Quiz').setIsQuiz(true).setShuffleQuestions(true).setRequireLogin(false).setPublishingSummary(true);
  
  // for each question/row
  for (var i = 0; i < inputRows.length; i++)
  {
    var tags = inputRows[i][3].split(' ');
    
    // for each tag in searchTags
    for (var j = 0; j < searchTags.length; j++)
    {
      if (tags.indexOf(searchTags[j]) >= 0){ // if tags of given row contains given tag in searchTag 
        var feedback = FormApp.createFeedback().setText(inputRows[i][1]).build();
        form.addTextItem().setPoints(1).setTitle(inputRows[i][0]).setGeneralFeedback(feedback);
        break;
      }
    }
  }
}

// Creates a new sheet with rows which match selected tags. Assumes tags to check are in column D.
function getEntriesWithTags() {
  var searchTags = ['micronutrient'] // tags with which to match
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var inputSheet = spreadsheet.getSheetByName('Questions');
  var inputRows = inputSheet.getRange(2, 1, inputSheet.getLastRow() - 1, inputSheet.getLastColumn()).getValues();
  var outputRows = [];
  // for each question/row
  for (var i = 0; i < inputRows.length; i++)
  {
    var tags = inputRows[i][3].split(' ');

    // for each tag in searchTags
    for (var j = 0; j < searchTags.length; j++)
    {
      if (tags.indexOf(searchTags[j]) >= 0){ // if tags of given row contains given tag in searchTag 
        outputRows.push(inputRows[i]);
        break;
      }
    }
  }
  if (outputRows.length > 0){
    var outputSheet = spreadsheet.insertSheet({template: inputSheet}).clear();
    var sheetName = searchTags.join(' ');
    
    if (spreadsheet.getSheetByName(sheetName) === null){
      outputSheet.setName(sheetName);
    }

    // inserts header
    outputSheet.getRange(1, 1, 1, inputSheet.getLastColumn()).setValues(inputSheet.getRange(1, 1, 1, inputSheet.getLastColumn()).getValues());

    // sets values
    outputSheet.getRange(2, 1, outputRows.length, inputSheet.getLastColumn()).setValues(outputRows);
  }
  else {
    Logger.log('no questions found');
  }
}

// Returns an array of tags of data's ancestors, and data itself.
function getParentTags(data, node){
  
  // base cases
  if (node.data === data){ // if node matches data
    return [node.data];
  }
  else if (node.children.length == 0){ // no children
    return [];
  }
  
  // recursive case
  else {
    var tags = [];
    
    // for each child of node
    for (var i = 0; i < node.children.length; i++)
    {
      var childTags = getParentTags(data, node.children[i]); // recursive call on child
      
      // for each tag in childTags
      for (var j = 0; j < childTags.length; j++)
      {
        if (tags.indexOf(childTags[j] < 0)){ // if tags does not contain tag in childTags
          tags.push(childTags[j]); // add tag in childTags to tags
        }
      }
    }
    
    // adds label of node to tags if node is an ancestor of data
    if (tags.indexOf(data) >= 0) {
        tags.push(node.data);
    }
    return tags;
  }
  
}

// Test function for getParentTags()
function getParentTagsTest() {
  var root = generateTree();
  Logger.log(getParentTags('nutrient', root));
}

// Generates a tree representing the heirarchy of tags. To adopt this program for other applications,
// this function will need to be manually modified.
function generateTree() {
  var root = new Node('root');
  addNewChildren(root, ['regulation', 'physical']);
  
  var psychology = addNewChild(root, 'psychology');
  addNewChildren(psychology, ['disorder', 'intake_regulation']);
  // physiology branch
  { 
    var physiology = addNewChild(root, 'physiology');
    addNewChildren(physiology, ['cell_function']);
    
    var digestion = addNewChild(physiology, 'digestion');
    addNewChildren(digestion, ['enzyme', 'stomach', 'intestines']);
    
    var nutrient = addNewChild(physiology, 'nutrient');
    addNewChildren(nutrient, ['phytochemical']);
    
    var macronutrient = addNewChild(nutrient, 'macronutrient');
    addNewChildren(macronutrient, ['carbohydrate', 'lipid', 'protein']);
    
    var micronutrient = addNewChild(nutrient, 'micronutrient');
    
    var waterSoluble = addNewChild(micronutrient, 'water-soluble');
    addNewChildren(waterSoluble, ['niacin', 'folate', 'pyridoxine', 'riboflavin', 'thiamin', 'biotin', 'B12', 'C', 'pantothenic']);
    
    var fatSoluble = addNewChild(micronutrient, 'fat-soluble');
    addNewChildren(fatSoluble, ['A', 'D', 'E', 'K']);
    
    var mineral = addNewChild(micronutrient, 'mineral');
    
    var major = addNewChild(mineral, 'major');
    addNewChildren(major, ['calcium', 'phosphorus']);
    
    var trace = addNewChild(mineral, 'trace');
    addNewChildren(trace, ['zinc', 'iron', 'copper', 'iodide']);
    
    var wholeBodyFunction = addNewChild(physiology, 'whole_body_function');
    addNewChildren(wholeBodyFunction, ['hormone', 'energy']);
    
    var consumption = addNewChild(physiology, 'consumption');
    addNewChildren(consumption, ['diet', 'weight', 'malnutrition']);
    
    var food = addNewChild(consumption, 'food')
    addNewChildren(food, ['alcohol']);
  }
  
  return root;
}

// Node object for tree
function Node(data) {
  this.data = data;
  this.parent = null;
  this.children = [];
}

// Creates a node and simultaneously specifies its parent. Returns the childObject
// converted into a node.
function addNewChild(parentNode, childObject) {
  // Establishes parent-child relationship between two nodes
  function addChild(parentNode, childNode) {
    parentNode.children.push(childNode);
    childNode.parent = parentNode;
  }
  
  var childNode = new Node(childObject);
  addChild(parentNode, childNode);
  return childNode;
}

// Creates nodes for each element of childObjects, adds it as a child of parent,
// and sets its parent. Returns nothing.
function addNewChildren(parentNode, childObjects) {
  childObjects.forEach(function(element) {
    addNewChild(parentNode, element);
  });
}

// Test function to log all nodes to the Logger
function testLogAll() {
  // Logs label of node and labels of all children of node recursively
  function logAll(node){
    Logger.log(node.data);
    node.children.forEach(function(child){
      logAll(child);
    });
  }
  logAll(generateTree());
}