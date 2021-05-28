import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FieldArray } from 'react-final-form-arrays';
import { Field, FormSpy, useFormState } from 'react-final-form';
import { OnChange } from 'react-final-form-listeners';
import get from 'lodash.get';
import { useStripes } from '@folio/stripes/core';
import { Button, Label, MultiSelection, OptionSegment, Select, IconButton, Selection } from '@folio/stripes/components';
import { exportCsv } from '@folio/stripes/util';
import { useLdp } from '../../LdpContext';
import loadColumns from '../../util/loadColumns';
import generateOptions from '../../util/generateOptions';
import BigError from '../BigError';
import css from './css/QuerySingleTable.css';
import ColumnFilter from './ColumnFilter';


const filterItems = ((filterText, list) => {
  const filterRegExp = new RegExp(`^${filterText}`, 'i');
  const renderedItems = filterText ? list.filter(item => item.search(filterRegExp) !== -1) : list;
  return { renderedItems };
});


// TODO: ability to add and remove table joins
// <span onClick={onRemove} style={{ cursor: "pointer" }}>❌</span>

function filterAvailableTables(tables, selectedSchema, ldp) {
  const disabledMap = {};
  ldp.disabledTables.forEach(name => {
    const [s, t] = name.split('-');
    if (s === selectedSchema) disabledMap[t] = true;
  });

  return tables[selectedSchema].filter(entry => !disabledMap[entry.value]);
}

const WhenFieldChanges = ({ field, set, to }) => (
  <Field name={set} subscription={{}}>
    {(
      // No subscription. We only use Field to get to the change function
      { input: { onChange } }
    ) => (
      <FormSpy subscription={{}}>
        {() => (
          <OnChange name={field}>
            {(value, previous) => {
              if (value !== previous) {
                onChange(to);
              }
            }}
          </OnChange>
        )}
      </FormSpy>
    )}
  </Field>
);

WhenFieldChanges.propTypes = {
  field: PropTypes.string,
  set: PropTypes.string,
  to: PropTypes.arrayOf(PropTypes.object),
};

const QuerySingleTable = ({
  namePrefix,
  tableIndex,
  tables,
  queryResponse,
  // onRemove,
  push,
}) => {
  const stripes = useStripes();
  const { values } = useFormState();
  const selectedSchema = get(values, `${namePrefix}.schema`);
  const selectedTableName = get(values, `${namePrefix}.tableName`);
  const [availableColumns, setColumns] = useState({ list: [], options: [] });
  const [error, setError] = useState(false);
  const ldp = useLdp();
  const limitOptions = generateOptions(0, 1 + Math.log10(ldp.maxShow || 1));

  useEffect(() => {
    if (selectedTableName) loadColumns(stripes, selectedSchema, selectedTableName, setColumns, setError);
  }, [stripes, selectedSchema, selectedTableName]);

  if (error) return <BigError message={error} />;

  const disabled = availableColumns.list.length === 0;

  return (
    <div className={css.QuerySingleTable} data-test-table>
      <div className="query-input">
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, marginRight: 5 }}>
            <Field
              name={`${namePrefix}.schema`}
              label="Schema"
              component={Selection}
              dataOptions={Object.keys(tables).map(schema => ({ label: schema, value: schema }))}
            />
          </div>
          <div style={{ flex: 3, marginLeft: 5 }}>
            <Field
              name={`${namePrefix}.tableName`}
              label="Table"
              component={Selection}
              dataOptions={filterAvailableTables(tables, selectedSchema, ldp)}
            />
          </div>
        </div>
        <WhenFieldChanges
          field={`${namePrefix}.tableName`}
          set={`${namePrefix}.columnFilters`}
          to={[{}]}
        />
        <WhenFieldChanges
          field={`${namePrefix}.tableName`}
          set={`${namePrefix}.showColumns`}
          to={[]}
        />
        <div>
          <Label htmlFor="choose-columns">Column</Label>
          <FieldArray id="choose-columns" name={`${namePrefix}.columnFilters`} tableIndex={tableIndex}>
            {({ fields }) => fields.map((name, index) => (
              <ColumnFilter
                name={name}
                index={index}
                key={name}
                availableColumns={availableColumns.options}
                onRemove={() => fields.remove(index)}
                disabled={disabled}
              />
            ))
            }
          </FieldArray>
          <Button disabled={disabled} onClick={() => push(`${namePrefix}.columnFilters`)}>Add Filter</Button>

          <Field
            name={`${namePrefix}.showColumns`}
            label="Show Columns"
            component={MultiSelection}
            placeholder="(All)"
            dataOptions={availableColumns.list}
            itemToString={(opt => opt)}
            formatter={({ option, searchTerm }) => <OptionSegment searchTerm={searchTerm}>{option}</OptionSegment>}
            filter={filterItems}
            disabled={disabled}
          />

          <Field
            name={`${namePrefix}.limit`}
            label="Limit number of results"
            component={Select}
            dataOptions={limitOptions}
            type="number"
            disabled={disabled}
          />
        </div>
        <div className={css.SubmitRow}>
          <Button type="submit" buttonStyle="primary" disabled={disabled}>Submit</Button>
          <IconButton ariaLabel="Download as CSV" icon="save" onClick={() => exportCsv(queryResponse.resp, {})} disabled={!get(queryResponse, 'resp.length')} />
        </div>
      </div>
    </div>
  );
};

QuerySingleTable.propTypes = {
  namePrefix: PropTypes.string,
  tableIndex: PropTypes.number,
  tables: PropTypes.object,
  queryResponse: PropTypes.object,
  push: PropTypes.func,
  // pop: PropTypes.func,
};

export default QuerySingleTable;
