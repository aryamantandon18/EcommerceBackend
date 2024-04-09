class ApiFeatures {
    constructor(query, queryStr) {
      this.query = query;
      this.queryStr = queryStr;
    }
    search() {
      const keyword = this.queryStr.keyword
        ? {
            name: {
              $regex: this.queryStr.keyword,
              $options: "i",            //czse insensitive
            },
          }
        : {};
      this.query = this.query.find({ ...keyword });
      return this;
    }
    filter() {
      const queryCopy = { ...this.queryStr };        
      const removeFields = ["keyword", "page", "limit"];
      removeFields.forEach((key) => delete queryCopy[key]);
      // Filter For Price and Rating 
      let queryStr = JSON.stringify(queryCopy);
      queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);    //replacing gt -> $gt , gte-> $gte  bcoz mongodb operators are like this.
      this.query = this.query.find(JSON.parse(queryStr));
      return this;
    }
    pagination(resultPerPage) {
      const currentPage = Number(this.queryStr.page)|| 1;    //converting string into number 
  
      const skip = resultPerPage * (currentPage - 1);
  
      this.query = this.query.limit(resultPerPage).skip(skip);
  
      return this;
    }
  }
  export default ApiFeatures;


    //.replace() is a JavaScript method used to find and replace parts of a string. In this case, it's being called on the queryStr string.
  //\b is a word boundary anchor. It matches the position between a word character (as defined by Unicode) and a non-word character.

// (gt|gte|lt|lte) is a capturing group that matches one of the four options inside it: "gt," "gte," "lt," or "lte." The | character serves as an OR operator, allowing the regular expression to match any of these options.

// \b is another word boundary anchor, which ensures that the matched text is a whole word, not just a substring within a larger word.

//So, the purpose of this line of code is to find occurrences of "gt," "gte," "lt," or "lte" within the queryStr string and replace them with "$gt," "$gte," "$lt," or "$lte," respectively. This is commonly used in the context of building queries for databases like MongoDB, where these symbols are used to specify comparison operators.