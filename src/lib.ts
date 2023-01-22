import isEqual from "lodash.isequal";

export const arrayContainsObject = (array: any, object: any) => {
    return array.some((item: any) => isEqual(item, object));
};

export const reduceObjectToProps = (object: any, props: Array<string>) => {
    return (
        Object.keys(object)
            // filter requiredSourceProps only
            .filter((key) => {
                return props.includes(key);
            })
            .reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: object[key],
                };
            }, {})
    );
};
