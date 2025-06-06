import { Types } from 'mongoose';

export interface Category{
    _id?: Types.ObjectId,
    name:string;
    isMainCategory:boolean;
    subcategories?: Array<Types.ObjectId>,
    description:string;
    categoryImageUrl:string;
}

export interface SubCategory {
  _id?: Types.ObjectId;
  name: string;
  isMainCategory: string;
  description: string;
  categoryImageUrl: string;
  subcategories?:Category[];
}

export interface categoryDto extends Omit<Category, '_id' >{
  _id:string
}

export interface CategoryInfo extends  Pick<Category,

'name' |
'description' |
'categoryImageUrl'
>{
_id:string
}

export interface SubCategoryInfo extends Pick<CategoryInfo,
'description'>{

}

export interface CategoryWithPopulatedSubs extends Omit<categoryDto, 'subcategories'> {
  subcategories: categoryDto[];
}


export interface UpdateCategoryDto extends Omit<Category, "_id" | 'categoryImageUrl'>{};


